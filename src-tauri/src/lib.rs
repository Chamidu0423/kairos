mod email;
mod db;
mod ai;
mod monitor;

use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_notification::NotificationExt;
use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct NotificationData {
    pub notif_type: String,
    pub title: String,
    pub body: String,
    pub duration: u64,
}

fn create_notification_window(app: &tauri::AppHandle) {
    let window_width = 380.0;
    let window_height = 180.0;

    if app.get_webview_window("notification").is_some() {
        return;
    }

    match WebviewWindowBuilder::new(
        app,
        "notification",
        WebviewUrl::App("index.html#/notification".into())
    )
    .title("Kairos Notification")
    .inner_size(window_width, window_height)
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .resizable(false)
    .visible(false)
    .build() {
        Ok(window) => {
            println!("✅ Notification window pre-created (hidden)");
            // Position it
            if let Ok(Some(monitor)) = window.primary_monitor() {
                let screen = monitor.size();
                let scale = monitor.scale_factor();
                let sw = screen.width as f64 / scale;
                let sh = screen.height as f64 / scale;
                let x = sw - window_width - 20.0;
                let y = sh - window_height - 60.0;
                let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition::new(x, y)));
            }
        },
        Err(e) => println!("❌ Failed to create notification window: {}", e)
    }
}

fn show_popup_notification(app: &tauri::AppHandle, notif_type: &str, title: &str, body: &str) {
    let duration: u64 = db::get_setting("notification_duration")
        .unwrap_or("10".to_string())
        .parse()
        .unwrap_or(10);

    // Get the precreated window
    if let Some(window) = app.get_webview_window("notification") {
        println!("🔔 Showing notification with duration: {}s", duration);
        
        // First show the window
        let _ = window.show();
        let _ = window.set_focus();
        
        // Clone for the thread
        let window_clone = window.clone();
        let notif_type = notif_type.to_string();
        let title = title.to_string();
        let body = body.to_string();

        // Small delay to ensure webview is ready
        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(150));
            println!("📤 Emitting notification-data event...");
            let _ = window_clone.emit("notification-data", NotificationData {
                notif_type,
                title,
                body,
                duration,
            });
        });
    } else {
        println!("⚠️ Notification window not found, creating...");
        create_notification_window(app);
        //Try again after creation
        std::thread::sleep(std::time::Duration::from_millis(100));
        if let Some(window) = app.get_webview_window("notification") {
            let notif_type = notif_type.to_string();
            let title = title.to_string();
            let body = body.to_string();
            let window_clone = window.clone();
            
            let _ = window.show();
            let _ = window.set_focus();
            
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(150));
                let _ = window_clone.emit("notification-data", NotificationData {
                    notif_type,
                    title,
                    body,
                    duration,
                });
            });
        }
    }
}

#[tauri::command]
fn hide_notification(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("notification") {
        let _ = window.hide();
        println!("🔔 Notification hidden");
    }
}

#[tauri::command]
fn test_notification(app: tauri::AppHandle) {
    let style = db::get_setting("notification_style").unwrap_or("custom".to_string());
    
    if style == "custom" {
        show_popup_notification(
            &app,
            "task",
            "✅ Test Notification",
            "This is a test notification from Kairos!\nCustom notifications are working perfectly."
        );
    } else {
        let _ = app.notification()
            .builder()
            .title("✅ Test Notification")
            .body("This is a test from Kairos!")
            .show();
    }
}

pub fn send_custom_notification(app: &tauri::AppHandle, notif_type: &str, title: &str, body: &str) {
    let style = db::get_setting("notification_style").unwrap_or("custom".to_string());
    
    if style == "custom" {
        show_popup_notification(app, notif_type, title, body);
    } else {
        let _ = app.notification()
            .builder()
            .title(title)
            .body(body)
            .show();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone();
            
            create_notification_window(&handle);
            
            // Background Monitor Start
            monitor::start_background_monitor(handle);
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            email::fetch_recent_emails,
            email::test_imap_connection,
            ai::analyze_email_with_ai,
            db::init,
            db::add_task,
            db::get_all_tasks,
            db::delete_task,
            db::toggle_task,
            db::save_app_setting,
            db::get_app_setting,
            test_notification,
            hide_notification
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
