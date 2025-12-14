use serde::{Deserialize, Serialize};
use serde_json::json;
use reqwest::blocking::Client;

#[derive(Debug, Serialize, Deserialize)]
pub struct AiTask {
    pub found_task: bool,
    pub title: String,
    pub due_date: String,
    pub priority: String,
}

#[tauri::command]
pub fn analyze_email_with_ai(content: String, api_key: String) -> Result<AiTask, String> {
    println!("ANALYZING EMAIL CONTENT:");
    println!("{}", content); 
    println!("--------------------------------------------------");
    let client = Client::new();

    let prompt = r#"
        You are a smart assistant. Analyze the email content.
        Extract tasks and deadlines.
        Return ONLY a raw JSON object (no markdown) with this format:
        {
            "found_task": true/false,
            "title": "Task Name",
            "due_date": "YYYY-MM-DD" (or "None"),
            "priority": "High/Medium/Low"
        }
    "#;

    let request_body = json!({
        "model": "google/gemma-3-27b-it:free", 
        "messages": [
            {"role": "system", "content": prompt},
            {"role": "user", "content": content}
        ],
        "temperature": 0.1
    });

    println!("Sending request to OpenRouter...");

    let response = client.post("https://openrouter.ai/api/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .header("HTTP-Referer", "http://localhost:1420")
        .header("X-Title", "Kairos App")
        .json(&request_body)
        .send()
        .map_err(|e| format!("Network Request Failed: {}", e))?;

    let status = response.status();
    
    if !status.is_success() {
        let error_text = response.text().unwrap_or("Unknown error".to_string());
        return Err(format!("API Error ({}): {}", status, error_text));
    }

    let response_json: serde_json::Value = response.json().map_err(|e| e.to_string())?;
    
    let content_text = response_json["choices"][0]["message"]["content"]
        .as_str()
        .ok_or("Invalid response format from AI")?;

    let clean_text = content_text.trim().trim_start_matches("```json").trim_end_matches("```").trim();

    let task_data: AiTask = serde_json::from_str(clean_text)
        .map_err(|e| format!("Failed to parse JSON: {}. Got: {}", e, clean_text))?;

    Ok(task_data)
}