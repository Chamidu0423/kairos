mod db;
mod email;
mod ai;

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
            email::fetch_recent_emails,
            ai::analyze_email_with_ai,
            db::add_task, 
            db::get_all_tasks
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}