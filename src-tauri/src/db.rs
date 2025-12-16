use rusqlite::{Connection, OptionalExtension};
use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use dirs::data_local_dir;

#[derive(Serialize)]
pub struct Task {
    pub id: i32,
    pub title: String,
    pub due_date: Option<String>,
    pub is_completed: bool,
}

// Helper Function
fn get_db_path() -> PathBuf {
    let mut path = data_local_dir().expect("Could not find local data directory");
    path.push("kairos");
    if !path.exists() {
        fs::create_dir_all(&path).expect("Could not create data directory");
    }
    path.push("kairos.db");
    path
}

fn get_connection() -> Result<Connection, rusqlite::Error> {
    let path = get_db_path();
    Connection::open(path)
}

#[tauri::command]
pub fn init() -> Result<(), String> {
    let conn = get_connection().map_err(|e| e.to_string())?;

    //Reminders Table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            due_date TEXT, 
            is_completed BOOLEAN DEFAULT 0
        )",
        [],
    ).map_err(|e| e.to_string())?;

    //settings Table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )",
        [],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

pub fn get_setting(key: &str) -> Result<String, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?1").map_err(|e| e.to_string())?;
    
    let value: Option<String> = stmt.query_row([key], |row| row.get(0))
        .optional()
        .map_err(|e| e.to_string())?;

    value.ok_or("Setting not found".to_string())
}

// Internal use
pub fn save_setting_internal(key: &str, value: &str) -> Result<(), String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
        [key, value],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

// Frontend Command
#[tauri::command]
pub fn save_app_setting(key: String, value: String) -> Result<(), String> {
    save_setting_internal(&key, &value)
}

// Frontend Command
#[tauri::command]
pub fn get_app_setting(key: String) -> Result<Option<String>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?1").map_err(|e| e.to_string())?;
    
    let value: Option<String> = stmt.query_row([&key], |row| row.get(0))
        .optional()
        .map_err(|e| e.to_string())?;

    Ok(value)
}

#[tauri::command]
pub fn add_task(title: String, due_date: String) -> Result<(), String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO reminders (title, due_date) VALUES (?1, ?2)",
        [&title, &due_date],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_all_tasks() -> Result<Vec<Task>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, title, due_date, is_completed FROM reminders ORDER BY id DESC").map_err(|e| e.to_string())?;
    
    let tasks_iter = stmt.query_map([], |row| {
        Ok(Task {
            id: row.get(0)?,
            title: row.get(1)?,
            due_date: row.get(2)?,
            is_completed: row.get(3)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut tasks = Vec::new();
    for task in tasks_iter {
        tasks.push(task.map_err(|e| e.to_string())?);
    }
    Ok(tasks)
}

#[tauri::command]
pub fn delete_task(id: i32) -> Result<(), String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM reminders WHERE id = ?1", [&id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn toggle_task(id: i32, is_completed: bool) -> Result<(), String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    let new_status = !is_completed;
    conn.execute("UPDATE reminders SET is_completed = ?1 WHERE id = ?2", (new_status, &id)).map_err(|e| e.to_string())?;
    Ok(())
}