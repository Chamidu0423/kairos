use serde::Serialize;
use native_tls::TlsConnector;
use imap::Client;
use std::net::TcpStream;
use mailparse::{MailHeaderMap, ParsedMail};

#[derive(Serialize, Clone)]
pub struct Email {
    pub id: u32,
    pub subject: String,
    pub from: String,
    pub date: String,
    pub body: String,
}

fn extract_text_body(parsed: &ParsedMail) -> String {
    if parsed.ctype.mimetype == "text/plain" {
        return parsed.get_body().unwrap_or_default();
    }

    for part in &parsed.subparts {
        let content = extract_text_body(part);
        if !content.is_empty() {
            return content;
        }
    }

    if parsed.ctype.mimetype == "text/html" {
        return parsed.get_body().unwrap_or_default();
    }

    "".to_string()
}

#[tauri::command]
pub async fn fetch_recent_emails(email: String, password: String, server: String) -> Result<Vec<Email>, String> {
    
    let result = tauri::async_runtime::spawn_blocking(move || {
        println!("🔄 Connecting to IMAP server...");
        let domain = server.as_str();
        let port = 993;

        let tcp_stream = TcpStream::connect((domain, port))
            .map_err(|e| format!("TCP Error: {}", e))?;
        let tls_connector = TlsConnector::builder()
            .build()
            .map_err(|e| format!("TLS Builder Error: {}", e))?;
        let tls_stream = tls_connector
            .connect(domain, tcp_stream)
            .map_err(|e| format!("TLS Handshake Error: {}", e))?;

        let client = Client::new(tls_stream);

        let mut imap_session = client
            .login(&email, &password)
            .map_err(|e| e.0.to_string())?;

        let mailbox = imap_session.select("INBOX").map_err(|e| e.to_string())?;
        let total_emails = mailbox.exists;

        if total_emails == 0 {
            return Ok(vec![]);
        }

        let start = if total_emails > 10 { total_emails - 9 } else { 1 };
        let fetch_range = format!("{}:{}", start, total_emails);

        println!("📥 Fetching emails in range: {}", fetch_range);

        let messages = imap_session.fetch(fetch_range, "RFC822").map_err(|e| e.to_string())?; 
        
        let mut emails = Vec::new();

        for message in messages.iter() {
            let body = message.body().expect("message did not have a body!");
            
            if let Ok(parsed) = mailparse::parse_mail(body) {
                let subject = parsed.headers.get_first_value("Subject").unwrap_or("No Subject".to_string());
                let from = parsed.headers.get_first_value("From").unwrap_or("Unknown".to_string());
                let date = parsed.headers.get_first_value("Date").unwrap_or("Unknown".to_string());

                let mut body_content = extract_text_body(&parsed);
                
                if body_content.trim().is_empty() {
                    body_content = "No readable text content found.".to_string();
                }

                emails.push(Email {
                    id: message.message,
                    subject,
                    from,
                    date,
                    body: body_content,
                });
            }
        }

        imap_session.logout().map_err(|e| e.to_string())?;

        emails.sort_by(|a, b| b.id.cmp(&a.id));
        
        println!("✅ Successfully fetched {} emails", emails.len());
        Ok(emails)

    }).await;

    match result {
        Ok(inner_result) => inner_result,
        Err(e) => Err(format!("Thread Error: {}", e)),
    }
}

#[tauri::command]
pub async fn test_imap_connection(email: String, password: String, server: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let domain = server.as_str();
        let port = 993;
        let tcp_stream = TcpStream::connect((domain, port)).map_err(|e| e.to_string())?;
        let tls_connector = TlsConnector::builder().build().map_err(|e| e.to_string())?;
        let tls_stream = tls_connector.connect(domain, tcp_stream).map_err(|e| e.to_string())?;
        let client = Client::new(tls_stream);
        let mut imap_session = client.login(&email, &password).map_err(|e| e.0.to_string())?;
        imap_session.logout().map_err(|e| e.to_string())?;
        Ok("Connection Successful".to_string())
    }).await.map_err(|e| e.to_string())?
}