use serde::{Deserialize, Serialize};
use serde_json::json;
use reqwest::blocking::Client;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AiTask {
    pub found_task: bool,
    pub title: String,
    pub due_date: String,
    pub priority: String,
}

pub fn analyze_email_internal(content: String, api_key: String) -> Result<AiTask, String> {
    let client = Client::new();

    let prompt = r#"
        You are a smart personal assistant. 
        Analyze the email content and extract actionable tasks.
        If there is a task, return found_task: true.
        Format date as YYYY-MM-DD. If no date, use "None".
        Return ONLY valid JSON.
        Example: {"found_task": true, "title": "Submit Assignment", "due_date": "2023-10-25", "priority": "High"}
    "#;

    let request_body = json!({
        "model": "mistralai/mistral-small-3.1-24b-instruct:free",
        "messages": [
            {"role": "system", "content": prompt},
            {"role": "user", "content": content}
        ],
        "temperature": 0.1
    });

    let response = client.post("https://openrouter.ai/api/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .header("HTTP-Referer", "http://localhost:1420")
        .header("X-Title", "Kairos App")
        .json(&request_body)
        .send()
        .map_err(|e| format!("Network Error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API Error: {}", response.status()));
    }

    let response_json: serde_json::Value = response.json().map_err(|e| e.to_string())?;
    
    let content_text = response_json["choices"][0]["message"]["content"]
        .as_str()
        .ok_or("Invalid AI response")?;

    let clean_text = content_text.trim().trim_start_matches("```json").trim_end_matches("```").trim();

    let task_data: AiTask = serde_json::from_str(clean_text)
        .map_err(|e| format!("JSON Parse Error: {}", e))?;

    Ok(task_data)
}

#[tauri::command]
pub fn analyze_email_with_ai(content: String, apiKey: String) -> Result<AiTask, String> {
    analyze_email_internal(content, apiKey)
}