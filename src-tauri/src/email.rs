use native_tls::TlsConnector;
use imap;
use serde::Serialize;
use mailparse::{MailHeaderMap, ParsedMail};

#[derive(Serialize)]
pub struct EmailData {
    pub id: u32,
    pub subject: String,
    pub from: String,
    pub date: String,
    pub body: String,
}

fn extract_text_body(parsed: &ParsedMail) -> String {
    if parsed.ctype.mimetype == "text/plain" {
        return parsed.get_body().unwrap_or("".to_string());
    }
    for subpart in &parsed.subparts {
        let body = extract_text_body(subpart);
        if !body.is_empty() {
            return body;
        }
    }
    "".to_string()
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

    let messages = imap_session.fetch("1:5", "RFC822").map_err(|e| e.to_string())?;

    let mut email_list = Vec::new();

    for message in messages.iter() {
        let raw_body = message.body().expect("body not found");
        
        let parsed = mailparse::parse_mail(raw_body).unwrap();
        
        let subject = parsed.headers.get_first_value("Subject").unwrap_or("No Subject".to_string());
        let from = parsed.headers.get_first_value("From").unwrap_or("Unknown".to_string());
        let date = parsed.headers.get_first_value("Date").unwrap_or("".to_string());
        
        let body_content = extract_text_body(&parsed);

        email_list.push(EmailData {
            id: message.message,
            subject,
            from,
            date,
            body: body_content,
        });
    }

    imap_session.logout().map_err(|e| e.to_string())?;
    Ok(email_list)
}