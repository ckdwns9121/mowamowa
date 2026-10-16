//! Now Playing bridge. macOS 15.4+ blocks third-party access to the private
//! MediaRemote framework, so we drive the bundled `mediaremote-adapter`
//! (github.com/ungive/mediaremote-adapter): Apple-signed `/usr/bin/perl`
//! loads the adapter framework and streams JSON lines for us.

use std::{
    io::{BufRead, BufReader},
    path::PathBuf,
    process::{Command, Stdio},
    sync::Mutex,
    time::Duration,
};

use serde_json::Value;
use tauri::{AppHandle, Emitter, Manager};

pub const EVENT: &str = "now-playing";

/// Last payload from the stream so a freshly mounted webview can catch up.
pub struct NowPlayingState(pub Mutex<Value>);

struct Adapter {
    script: PathBuf,
    framework: PathBuf,
}

fn adapter(app: &AppHandle) -> Option<Adapter> {
    let root = app.path().resource_dir().ok()?.join("resources").join("mediaremote");
    let adapter = Adapter {
        script: root.join("mediaremote-adapter.pl"),
        framework: root.join("MediaRemoteAdapter.framework"),
    };
    if adapter.script.exists() && adapter.framework.exists() {
        Some(adapter)
    } else {
        eprintln!("now playing adapter missing at {}", root.display());
        None
    }
}

impl Adapter {
    fn command(&self, args: &[&str]) -> Command {
        let mut command = Command::new("/usr/bin/perl");
        command.arg(&self.script).arg(&self.framework).args(args);
        command
    }
}

/// Streams the system Now Playing item to the tray window for the app's lifetime.
pub fn start(app: &AppHandle) {
    app.manage(NowPlayingState(Mutex::new(Value::Null)));
    let Some(adapter) = adapter(app) else { return };
    let app = app.clone();
    std::thread::spawn(move || loop {
        let child = adapter
            .command(&["stream", "--no-diff", "--debounce=150"])
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn();
        match child {
            Ok(mut child) => {
                if let Some(stdout) = child.stdout.take() {
                    for line in BufReader::new(stdout).lines().map_while(Result::ok) {
                        let Ok(message) = serde_json::from_str::<Value>(&line) else { continue };
                        let payload = message.get("payload").cloned().unwrap_or(Value::Null);
                        *app.state::<NowPlayingState>().0.lock().unwrap() = payload.clone();
                        let _ = app.emit_to("tray", EVENT, payload);
                    }
                }
                let _ = child.wait();
            }
            Err(error) => eprintln!("now playing stream failed to start: {error}"),
        }
        // ponytail: fixed 3s retry; exponential backoff if the adapter ever flaps.
        std::thread::sleep(Duration::from_secs(3));
    });
}

#[tauri::command]
pub fn now_playing(state: tauri::State<'_, NowPlayingState>) -> Value {
    state.0.lock().unwrap().clone()
}

/// MediaRemote command ids: 0 play · 1 pause · 2 toggle · 4 next · 5 previous.
#[tauri::command]
pub fn media_send(app: AppHandle, command: u8) -> Result<(), String> {
    let adapter = adapter(&app).ok_or("Now Playing 어댑터를 찾지 못했습니다.")?;
    let status = adapter
        .command(&["send", &command.to_string()])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .map_err(|error| error.to_string())?;
    if status.success() { Ok(()) } else { Err(format!("미디어 명령이 실패했습니다. ({status})")) }
}
