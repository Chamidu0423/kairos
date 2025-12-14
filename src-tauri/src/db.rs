use rusqlite::{Connection, Result};
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

fn get_db_path() -> PathBuf {
    let mut path = data_local_dir().expect("Could not find local data directory");
    path.push("kairos"); 
    
    if !path.exists() {
        fs::create_dir_all(&path).expect("Could not create data directory");
    }
    
    path.push("kairos.db");
    path
}

fn get_connection() -> Result<Connection> {
    let path = get_db_path();
    println!("Database Path: {:?}", path); 
    Connection::open(path)
}

//Init Database
pub fn init() -> Result<()> {
    let conn = get_connection()?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            due_date TEXT, 
            is_completed BOOLEAN DEFAULT 0,
            reminder_sent BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    Ok(())
}

//Add Task
#[tauri::command]
pub fn add_task(title: String, due_date: String) -> Result<(), String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT INTO reminders (title, due_date) VALUES (?1, ?2)",
        [&title, &due_date],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

//  Get All Tasks
#[tauri::command]
pub fn get_all_tasks() -> Result<Vec<Task>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("SELECT id, title, due_date, is_completed FROM reminders ORDER BY id DESC")
        .map_err(|e| e.to_string())?;

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