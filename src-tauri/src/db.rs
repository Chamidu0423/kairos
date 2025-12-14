use rusqlite::{Connection, Result};
use std::fs;
use std::path::Path;

pub fn get_connection() -> Result<Connection> {
    let db_path = "kairos.db";
    Connection::open(db_path)
}

pub fn init() -> Result<()> {
    let conn = get_connection()?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )",
        [],
    )?;

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

    conn.execute(
        "CREATE TABLE IF NOT EXISTS processed_logs (
            email_uid TEXT PRIMARY KEY,
            processed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    println!("✅ Database initialized successfully: kairos.db");
    Ok(())
}