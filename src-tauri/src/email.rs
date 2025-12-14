use native_tls::TlsConnector;
use imap;
use serde::Serialize;
use std::iter::FromIterator;

#[derive(Serialize)]
pub struct EmailData {
    pub id: u32,
    pub subject: String,
    pub from: String,
    pub date: String,
}

#[tauri::command]
pub fn test_imap_connection(email: String, password: String, server: String) -> Result<String, String> {
    let tls = TlsConnector::builder().build().map_err(|e| e.to_string())?;
    let client = imap::connect((server.as_str(), 993), server.as_str(), &tls)
        .map_err(|e| format!("Connection Failed: {}", e))?;
    
    let mut imap_session = client.login(&email, &password)
        .map_err(|e| format!("Login Failed: {}", e.0))?;

    imap_session.logout().map_err(|e| e.to_string())?;
    Ok("Successfully Connected!".to_string())
}

#[tauri::command]
pub fn fetch_recent_emails(email: String, password: String, server: String) -> Result<Vec<EmailData>, String> {
    let tls = TlsConnector::builder().build().map_err(|e| e.to_string())?;
    let client = imap::connect((server.as_str(), 993), server.as_str(), &tls)
        .map_err(|e| e.to_string())?;

    let mut imap_session = client.login(&email, &password)
        .map_err(|e| e.0.to_string())?;

    imap_session.select("INBOX").map_err(|e| e.to_string())?;

    let messages = imap_session.fetch("1:5", "RFC822.HEADER").map_err(|e| e.to_string())?;

    let mut email_list = Vec::new();

    for message in messages.iter() {
        let header = message.header().expect("header not found");
        let parsed = mailparse::parse_header(header).unwrap(); 
        
        let subject = parsed.get_headers().get_first_value("Subject").unwrap_or("No Subject".to_string());
        let from = parsed.get_headers().get_first_value("From").unwrap_or("Unknown".to_string());
        let date = parsed.get_headers().get_first_value("Date").unwrap_or("".to_string());

        email_list.push(EmailData {
            id: message.message,
            subject,
            from,
            date,
        });
    }

    imap_session.logout().map_err(|e| e.to_string())?;
    Ok(email_list)
}