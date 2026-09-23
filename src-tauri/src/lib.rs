use std::{
    collections::HashMap,
    fs,
    path::PathBuf,
    sync::{Arc, Mutex, OnceLock},
    time::{Duration, Instant, SystemTime},
};
use tauri::{
    image::Image,
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, WindowEvent,
};
use tauri_plugin_positioner::{Position, WindowExt};
use tauri_plugin_sql::{Migration, MigrationKind};

mod jira_issue;
mod github_reviews;

const KEYCHAIN_SERVICE: &str = "com.orbit.desktop";
static SECRET_CACHE: OnceLock<Mutex<HashMap<String, String>>> = OnceLock::new();
static APP_HANDLE: OnceLock<AppHandle> = OnceLock::new();

#[derive(Clone, Copy, PartialEq, Eq)]
enum SecretStorageMode {
    Keychain,
    File,
    Session,
}

impl SecretStorageMode {
    fn as_str(self) -> &'static str {
        match self {
            Self::Keychain => "keychain",
            Self::File => "file",
            Self::Session => "session",
        }
    }

    fn parse(value: &str) -> Result<Self, String> {
        match value {
            "keychain" => Ok(Self::Keychain),
            "file" => Ok(Self::File),
            "session" => Ok(Self::Session),
            _ => Err("지원하지 않는 자격 증명 저장 방식입니다.".into()),
        }
    }
}

fn app_data_file(name: &str) -> Result<PathBuf, String> {
    let app = APP_HANDLE
        .get()
        .ok_or_else(|| "Orbit 앱이 아직 초기화되지 않았습니다.".to_string())?;
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;
    fs::create_dir_all(&directory).map_err(|error| error.to_string())?;
    Ok(directory.join(name))
}

fn storage_mode() -> SecretStorageMode {
    app_data_file("secret-storage-mode")
        .ok()
        .and_then(|path| fs::read_to_string(path).ok())
        .and_then(|value| SecretStorageMode::parse(value.trim()).ok())
        .unwrap_or(SecretStorageMode::Keychain)
}

fn local_secrets() -> Result<HashMap<String, String>, String> {
    let path = app_data_file("secrets.json")?;
    match fs::read_to_string(path) {
        Ok(value) => serde_json::from_str(&value).map_err(|error| error.to_string()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(HashMap::new()),
        Err(error) => Err(error.to_string()),
    }
}

fn write_local_secrets(secrets: &HashMap<String, String>) -> Result<(), String> {
    let path = app_data_file("secrets.json")?;
    let value = serde_json::to_vec_pretty(secrets).map_err(|error| error.to_string())?;
    fs::write(&path, value).map_err(|error| error.to_string())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(path, fs::Permissions::from_mode(0o600))
            .map_err(|error| error.to_string())?;
    }
    Ok(())
}

fn secret_cache() -> &'static Mutex<HashMap<String, String>> {
    SECRET_CACHE.get_or_init(|| Mutex::new(HashMap::new()))
}

fn cached_secret(secret_id: &str) -> Result<Option<String>, String> {
    secret_cache()
        .lock()
        .map(|cache| cache.get(secret_id).cloned())
        .map_err(|_| "자격 증명 메모리 캐시를 읽지 못했습니다.".to_string())
}

fn cache_secret(secret_id: &str, value: &str) -> Result<(), String> {
    secret_cache()
        .lock()
        .map(|mut cache| {
            cache.insert(secret_id.to_owned(), value.to_owned());
        })
        .map_err(|_| "자격 증명 메모리 캐시를 갱신하지 못했습니다.".to_string())
}

fn remove_cached_secret(secret_id: &str) -> Result<(), String> {
    secret_cache()
        .lock()
        .map(|mut cache| {
            cache.remove(secret_id);
        })
        .map_err(|_| "자격 증명 메모리 캐시를 정리하지 못했습니다.".to_string())
}

fn validate_secret_id(secret_id: &str) -> Result<(), String> {
    match secret_id {
        "jira_api_token"
        | "google_client_secret"
        | "google_refresh_token"
        | "slack_oauth_token"
        | "openai_api_key"
        | "claude_api_key"
        | "glm_api_key" => Ok(()),
        _ => Err("지원하지 않는 보안 항목입니다.".into()),
    }
}

fn set_internal_secret(secret_id: &str, value: &str) -> Result<(), String> {
    if storage_mode() == SecretStorageMode::File {
        let mut secrets = local_secrets()?;
        secrets.insert(secret_id.to_owned(), value.to_owned());
        write_local_secrets(&secrets)?;
        return cache_secret(secret_id, value);
    }
    if storage_mode() == SecretStorageMode::Session {
        return cache_secret(secret_id, value);
    }
    keychain_entry(secret_id)?
        .set_password(value)
        .map_err(|error| error.to_string())?;
    cache_secret(secret_id, value)
}

fn delete_internal_secret(secret_id: &str) -> Result<(), String> {
    if storage_mode() == SecretStorageMode::File {
        let mut secrets = local_secrets()?;
        secrets.remove(secret_id);
        write_local_secrets(&secrets)?;
        return remove_cached_secret(secret_id);
    }
    if storage_mode() == SecretStorageMode::Session {
        return remove_cached_secret(secret_id);
    }
    match keychain_entry(secret_id)?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => remove_cached_secret(secret_id),
        Err(error) => Err(error.to_string()),
    }
}

fn keychain_entry(secret_id: &str) -> Result<keyring::Entry, String> {
    validate_secret_id(secret_id)?;
    keyring::Entry::new(KEYCHAIN_SERVICE, secret_id).map_err(|error| error.to_string())
}

fn get_secret(secret_id: &str) -> Result<String, String> {
    validate_secret_id(secret_id)?;
    if let Some(value) = cached_secret(secret_id)? {
        return Ok(value);
    }
    let value = match storage_mode() {
        SecretStorageMode::File => local_secrets()?.get(secret_id).cloned().ok_or_else(key_missing_message),
        SecretStorageMode::Session => Err(key_missing_message()),
        SecretStorageMode::Keychain => match keychain_entry(secret_id)?.get_password() {
            Ok(value) => Ok(value),
            Err(keyring::Error::NoEntry) => Err(key_missing_message()),
            Err(error) => Err(format!("macOS Keychain에서 자격 증명을 읽지 못했습니다. Orbit의 Keychain 접근을 허용해주세요. ({error})")),
        },
    };
    match value {
        Ok(value) if !value.is_empty() => {
            cache_secret(secret_id, &value)?;
            Ok(value)
        }
        Ok(_) => Err(key_missing_message()),
        Err(error) => Err(error),
    }
}

fn key_missing_message() -> String {
    "저장된 자격 증명이 없습니다. Jira 연결 설정에서 API 토큰을 저장해주세요.".into()
}

fn get_optional_secret(secret_id: &str) -> Result<Option<String>, String> {
    validate_secret_id(secret_id)?;
    if let Some(value) = cached_secret(secret_id)? {
        return Ok(Some(value));
    }
    let value = match storage_mode() {
        SecretStorageMode::File => local_secrets()?.get(secret_id).cloned(),
        SecretStorageMode::Session => None,
        SecretStorageMode::Keychain => match keychain_entry(secret_id)?.get_password() {
            Ok(value) => Some(value),
            Err(keyring::Error::NoEntry) => None,
            Err(error) => return Err(format!("macOS Keychain에서 자격 증명을 읽지 못했습니다. Orbit의 Keychain 접근을 허용해주세요. ({error})")),
        },
    };
    match value.filter(|value| !value.is_empty()) {
        Some(value) => {
            cache_secret(secret_id, &value)?;
            Ok(Some(value))
        }
        None => Ok(None),
    }
}

#[tauri::command]
fn secret_storage_mode() -> &'static str {
    storage_mode().as_str()
}

#[tauri::command]
fn set_secret_storage_mode(mode: String) -> Result<(), String> {
    let mode = SecretStorageMode::parse(&mode)?;
    let path = app_data_file("secret-storage-mode")?;
    fs::write(path, mode.as_str()).map_err(|error| error.to_string())?;
    secret_cache()
        .lock()
        .map_err(|_| "자격 증명 캐시를 정리하지 못했습니다.".to_string())?
        .clear();
    Ok(())
}

#[tauri::command]
fn secret_status(secret_id: String) -> Result<bool, String> {
    validate_secret_id(&secret_id)?;
    if cached_secret(&secret_id)?.is_some() {
        return Ok(true);
    }
    get_optional_secret(&secret_id).map(|value| value.is_some())
}

#[tauri::command]
fn set_secret(secret_id: String, value: String) -> Result<(), String> {
    if value.trim().is_empty() {
        return Err("비어 있는 값은 저장할 수 없습니다.".into());
    }

    set_internal_secret(&secret_id, &value)
}

#[tauri::command]
fn delete_secret(secret_id: String) -> Result<(), String> {
    validate_secret_id(&secret_id)?;
    delete_internal_secret(&secret_id)
}

#[cfg(test)]
mod secret_cache_tests {
    use super::{cache_secret, cached_secret, remove_cached_secret, SecretStorageMode};

    #[test]
    fn accepts_supported_secret_storage_modes() {
        assert_eq!(SecretStorageMode::parse("file").unwrap().as_str(), "file");
        assert!(SecretStorageMode::parse("unknown").is_err());
    }

    #[test]
    fn reuses_and_removes_cached_credentials() {
        let secret_id = "test_memory_only_secret";
        cache_secret(secret_id, "value").expect("cache secret");
        assert_eq!(
            cached_secret(secret_id).expect("read cache").as_deref(),
            Some("value")
        );
        remove_cached_secret(secret_id).expect("remove cache");
        assert!(cached_secret(secret_id)
            .expect("read empty cache")
            .is_none());
    }
}

#[tauri::command]
fn show_tray_window(app: AppHandle) -> Result<(), String> {
    let handle = app.clone();
    app.run_on_main_thread(move || {
        if let Some(window) = handle.get_webview_window("tray") {
            *handle.state::<Arc<Mutex<Instant>>>().lock().unwrap() = Instant::now();
            configure_window_for_all_spaces(&window);
            let _ = window.move_window_constrained(Position::TrayCenter);
            let _ = window.show();
            bring_window_to_front(&window, true);
            let _ = window.set_focus();
        }
    }).map_err(|error| error.to_string())
}

#[tauri::command]
fn hide_tray_window(app: AppHandle) {
    if let Some(window) = app.get_webview_window("tray") {
        let _ = window.hide();
    }
}

#[cfg(target_os = "macos")]
fn configure_window_for_all_spaces(window: &tauri::WebviewWindow) {
    use objc2_app_kit::{NSWindow, NSWindowCollectionBehavior, NSPopUpMenuWindowLevel};

    let _ = window.set_visible_on_all_workspaces(true);

    if let Ok(ns_window_ptr) = window.ns_window() {
        unsafe {
            let ns_window: &NSWindow = &*ns_window_ptr.cast();
            let mut behavior = ns_window.collectionBehavior();
            // FullScreenAuxiliary alone does not opt into other applications'
            // full-screen spaces. Clear mutually exclusive roles before joining
            // those spaces (also used by Stage Manager on macOS 13+).
            behavior.remove(
                NSWindowCollectionBehavior::Stationary
                    | NSWindowCollectionBehavior::MoveToActiveSpace
                    | NSWindowCollectionBehavior::FullScreenPrimary
                    | NSWindowCollectionBehavior::FullScreenNone
                    | NSWindowCollectionBehavior::Primary
                    | NSWindowCollectionBehavior::Auxiliary,
            );
            behavior |= NSWindowCollectionBehavior::CanJoinAllSpaces
                | NSWindowCollectionBehavior::FullScreenAuxiliary;
            if objc2::available!(macos = 13.0) {
                behavior |= NSWindowCollectionBehavior::CanJoinAllApplications;
            }
            ns_window.setCollectionBehavior(behavior);

            if window.label() == "tray" {
                ns_window.setLevel(NSPopUpMenuWindowLevel);
            }
        }
    }
}

#[cfg(not(target_os = "macos"))]
fn configure_window_for_all_spaces(window: &tauri::WebviewWindow) {
    let _ = window.set_visible_on_all_workspaces(true);
}

#[cfg(target_os = "macos")]
fn bring_window_to_front(window: &tauri::WebviewWindow, activate_app: bool) {
    use objc2::MainThreadMarker;
    use objc2_app_kit::{NSApplication, NSWindow};

    if let Ok(ns_window_ptr) = window.ns_window() {
        unsafe {
            if activate_app {
                let mtm = MainThreadMarker::new_unchecked();
                let app = NSApplication::sharedApplication(mtm);
                #[allow(deprecated)]
                app.activateIgnoringOtherApps(true);
            }

            let ns_window: &NSWindow = &*ns_window_ptr.cast();
            ns_window.orderFrontRegardless();
            ns_window.makeKeyAndOrderFront(None);
        }
    }
}

#[cfg(not(target_os = "macos"))]
fn bring_window_to_front(_window: &tauri::WebviewWindow, _activate_app: bool) {}

#[tauri::command]
fn show_pet_window(app: AppHandle) {
    if let Some(window) = app.get_webview_window("pet") {
        configure_window_for_all_spaces(&window);
        let _ = window.show();
        let _ = window.set_focus();
        bring_window_to_front(&window, false);
    }
}

#[tauri::command]
fn hide_pet_window(app: AppHandle) {
    if let Some(window) = app.get_webview_window("pet") {
        let _ = window.hide();
    }
}

#[tauri::command]
fn toggle_pet_window(app: AppHandle) -> Result<bool, String> {
    if let Some(window) = app.get_webview_window("pet") {
        let is_visible = window.is_visible().unwrap_or(false);
        if is_visible {
            let _ = window.hide();
            Ok(false)
        } else {
            configure_window_for_all_spaces(&window);
            let _ = window.show();
            let _ = window.set_focus();
            bring_window_to_front(&window, false);
            Ok(true)
        }
    } else {
        Err("Pet 윈도우를 찾을 수 없습니다.".into())
    }
}

#[tauri::command]
fn is_pet_window_visible(app: AppHandle) -> bool {
    app.get_webview_window("pet")
        .and_then(|w| w.is_visible().ok())
        .unwrap_or(false)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_work_items",
            sql: include_str!("../migrations/0001_work_items.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_calendar_events",
            sql: include_str!("../migrations/0002_calendar_events.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "create_app_settings",
            sql: include_str!("../migrations/0003_app_settings.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "create_ai_sessions",
            sql: include_str!("../migrations/0004_ai_sessions.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "create_work_item_links",
            sql: include_str!("../migrations/0005_work_item_links.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "add_session_alias_and_commit_links",
            sql: include_str!("../migrations/0006_session_alias_and_commit_links.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 7,
            description: "simplify_task_flow",
            sql: include_str!("../migrations/0007_simplify_task_flow.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 8,
            description: "add_task_delete_cleanup",
            sql: include_str!("../migrations/0008_task_delete_cleanup.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 9,
            description: "create_github_pull_request_cache",
            sql: include_str!("../migrations/0009_github_pull_requests.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 10,
            description: "scope_pull_requests_to_active_github_user",
            sql: include_str!("../migrations/0010_scope_pull_requests_to_viewer.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 11,
            description: "create_jira_issue_cache",
            sql: include_str!("../migrations/0011_jira_issues.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 12,
            description: "cache_jira_development_context",
            sql: include_str!("../migrations/0012_jira_development_cache.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 13,
            description: "create_google_calendar_sync",
            sql: include_str!("../migrations/0013_google_calendar_sync.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 14,
            description: "create_chat_threads",
            sql: include_str!("../migrations/0014_chat_threads.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 15,
            description: "cache_slack_message_searches",
            sql: include_str!("../migrations/0015_slack_message_cache.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 16,
            description: "cache_confluence_searches",
            sql: include_str!("../migrations/0016_confluence_search_cache.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 17,
            description: "add_slack_work_item_links",
            sql: include_str!("../migrations/0017_add_slack_work_item_links.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 18,
            description: "add_pull_request_viewer_relations",
            sql: include_str!("../migrations/0018_add_pull_request_viewer_relations.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 19,
            description: "repair_work_item_delete_trigger",
            sql: include_str!("../migrations/0019_repair_work_item_delete_trigger.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 20,
            description: "add_work_item_target_time",
            sql: include_str!("../migrations/0020_add_work_item_target_time.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 21,
            description: "create_work_continuity_foundation",
            sql: include_str!("../migrations/0021_work_continuity_foundation.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 22,
            description: "create_inbox_and_external_actions",
            sql: include_str!("../migrations/0022_inbox_and_external_actions.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 23,
            description: "create_reviews_templates_automation",
            sql: include_str!("../migrations/0023_reviews_templates_automation.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 24,
            description: "repair_continuity_focus_protocol",
            sql: include_str!("../migrations/0024_repair_continuity_focus_protocol.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 25,
            description: "repair_completion_revision_protocol",
            sql: include_str!("../migrations/0025_repair_completion_revision_protocol.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 26,
            description: "execute_automation_actions_safely",
            sql: include_str!("../migrations/0026_automation_execution.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 27,
            description: "create_rebuildable_context_graph",
            sql: include_str!("../migrations/0027_context_graph.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 28,
            description: "harden_context_graph_projection",
            sql: include_str!("../migrations/0028_context_graph_hardening.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 29,
            description: "create_daily_planner",
            sql: include_str!("../migrations/0029_daily_planner.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 30,
            description: "create_simple_planner",
            sql: include_str!("../migrations/0030_simple_planner.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 31,
            description: "create_daily_priorities",
            sql: include_str!("../migrations/0031_daily_priorities.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 32,
            description: "durable_chat_agent_runs",
            sql: include_str!("../migrations/0032_chat_agent_runs.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 33,
            description: "create_task_workflow_documents",
            sql: include_str!("../migrations/0033_task_workflow_documents.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 34,
            description: "allow_direct_task_completion",
            sql: include_str!("../migrations/0034_allow_direct_task_completion.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 35,
            description: "daily_focus_history",
            sql: include_str!("../migrations/0035_daily_focus_history.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_positioner::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:orbit.db", migrations)
                .build(),
        )
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let last_tray_shown = Arc::new(Mutex::new(Instant::now()));
            app.manage(last_tray_shown.clone());
            let last_tray_shown_blur = last_tray_shown.clone();
            let last_tray_shown_click = last_tray_shown.clone();

            let _ = APP_HANDLE.set(app.handle().clone());
            let clock = app.handle().clone();
            std::thread::spawn(move || {
                let mut awake = Instant::now();
                let mut wall = SystemTime::now();
                loop {
                    std::thread::sleep(Duration::from_secs(1));
                    let next_awake = Instant::now();
                    let next_wall = SystemTime::now();
                    // On macOS Instant uses the awake clock. Wall/awake divergence
                    // detects even short system sleeps; clock changes also pause safely.
                    let slept = next_wall.duration_since(wall).map_or(true, |elapsed| {
                        elapsed > next_awake.duration_since(awake) + Duration::from_millis(250)
                    });
                    let _ = clock.emit_to("tray", "focus-clock", slept);
                    awake = next_awake;
                    wall = next_wall;
                }
            });
            if let Some(window) = app.get_webview_window("tray") {
                configure_window_for_all_spaces(&window);
                let _ = window.hide();
                let window_to_hide = window.clone();
                window.on_window_event(move |event| {
                    eprintln!("TRAY WINDOW EVENT: {:?}", event);
                    if matches!(event, WindowEvent::Focused(false)) {
                        let elapsed = last_tray_shown_blur.lock().unwrap().elapsed();
                        if elapsed < Duration::from_millis(600) {
                            eprintln!("TRAY BLUR IGNORED (grace period: {:?} < 600ms)", elapsed);
                            let win = window_to_hide.clone();
                            let app_handle = win.app_handle().clone();
                            let _ = app_handle.run_on_main_thread(move || {
                                if win.is_visible().unwrap_or(false) {
                                    bring_window_to_front(&win, true);
                                }
                            });
                        } else {
                            eprintln!("TRAY HIDING DUE TO BLUR (Focused(false), elapsed: {:?})", elapsed);
                            let _ = window_to_hide.hide();
                        }
                    }
                });
            }

            if let Some(pet_window) = app.get_webview_window("pet") {
                configure_window_for_all_spaces(&pet_window);
                let _ = pet_window.show();
                bring_window_to_front(&pet_window, false);
            }

            let tray_icon = Image::from_bytes(include_bytes!("../icons/tray-icon.png"))
                .expect("valid Orbit tray icon");

            let quit = tauri::menu::MenuItem::with_id(app, "quit", "Orbit 종료", true, None::<&str>)?;
            let menu = tauri::menu::Menu::with_items(app, &[&quit])?;

            TrayIconBuilder::with_id("orbit")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| {
                    if event.id.as_ref() == "quit" {
                        app.exit(0);
                    }
                })
                .icon(tray_icon)
                .icon_as_template(true)
                .tooltip("Orbit · 작업 빠른 보기")
                .on_tray_icon_event(move |tray, event| {
                    eprintln!("ON TRAY ICON EVENT: {:?}", event);
                    tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);

                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        if let Some(window) = tray.app_handle().get_webview_window("tray") {
                            let is_visible = window.is_visible().unwrap_or(false);
                            let elapsed = last_tray_shown_click.lock().unwrap().elapsed();
                            eprintln!("TRAY CLICK STATE: is_visible={}, elapsed={:?}", is_visible, elapsed);

                            if is_visible && elapsed > Duration::from_millis(300) {
                                eprintln!("TRAY ACTION: HIDING (toggle)");
                                let _ = window.hide();
                            } else {
                                eprintln!("TRAY ACTION: SHOWING");
                                *last_tray_shown_click.lock().unwrap() = Instant::now();
                                configure_window_for_all_spaces(&window);
                                let pos_res = window.move_window_constrained(Position::TrayCenter);
                                eprintln!("TRAY MOVE RESULT: {:?}", pos_res);
                                let show_res = window.show();
                                eprintln!("TRAY SHOW RESULT: {:?}", show_res);
                                bring_window_to_front(&window, true);
                                let focus_res = window.set_focus();
                                eprintln!("TRAY FOCUS RESULT: {:?}", focus_res);
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            show_tray_window,
            hide_tray_window,
            show_pet_window,
            hide_pet_window,
            toggle_pet_window,
            is_pet_window_visible,
            secret_status,
            secret_storage_mode,
            set_secret_storage_mode,
            set_secret,
            delete_secret,
            jira_issue::fetch_assigned_jira_issues,
            github_reviews::fetch_github_review_requests
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
