mod db;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    match db::init() {
        Ok(_) => println!("Database initialized successfully!"),
        Err(e) => eprintln!("Database Error: {}", e),
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}