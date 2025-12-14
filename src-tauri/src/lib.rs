mod db;
mod email;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    match db::init() {
        Ok(_) => println!("Database initialized successfully!"),
        Err(e) => eprintln!("Database Error: {}", e),
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            email::test_imap_connection,
            email::fetch_recent_emails
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}