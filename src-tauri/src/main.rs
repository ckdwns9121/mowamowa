// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(target_os = "macos")]
    unsafe {
        use objc2::MainThreadMarker;
        use objc2_app_kit::{NSApplication, NSApplicationActivationPolicy};
        let mtm = MainThreadMarker::new_unchecked();
        let app = NSApplication::sharedApplication(mtm);
        app.setActivationPolicy(NSApplicationActivationPolicy::Accessory);
    }

    orbit_lib::run()
}
