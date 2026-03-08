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

#[derive(Debug, Clone)]
pub struct AiProvider {
    pub name: String,
    pub base_url: String,
    pub default_model: String,
}

// AI Provider configurations
fn get_provider_config(provider: &str) -> AiProvider {
    match provider {
        "openrouter" => AiProvider {
            name: "OpenRouter".to_string(),
            base_url: "https://openrouter.ai/api/v1/chat/completions".to_string(),
            default_model: "mistralai/mistral-small-3.1-24b-instruct:free".to_string(),
        },
        "groq" => AiProvider {
            name: "Groq".to_string(),
            base_url: "https://api.groq.com/openai/v1/chat/completions".to_string(),
            default_model: "llama-3.3-70b-versatile".to_string(),
        },
        "openai" => AiProvider {
            name: "OpenAI".to_string(),
            base_url: "https://api.openai.com/v1/chat/completions".to_string(),
            default_model: "gpt-4o-mini".to_string(),
        },
        "deepseek" => AiProvider {
            name: "DeepSeek".to_string(),
            base_url: "https://api.deepseek.com/v1/chat/completions".to_string(),
            default_model: "deepseek-chat".to_string(),
        },
        "claude" => AiProvider {
            name: "Claude".to_string(),
            base_url: "https://api.anthropic.com/v1/messages".to_string(),
            default_model: "claude-3-haiku-20240307".to_string(),
        },
        _ => get_provider_config("openrouter"), // Default fallback
    }
}

// Analyze email with any provider
pub fn analyze_email_internal(content: String, api_key: String, provider: String) -> Result<AiTask, String> {
    let client = Client::new();
    let config = get_provider_config(&provider);

    let prompt = r#"
        You are a smart personal assistant. 
        Analyze the email content and extract actionable tasks.
        If there is a task, return found_task: true.
        Format date as YYYY-MM-DD. If no date, use "None".
        Return ONLY valid JSON.
        Example: {"found_task": true, "title": "Submit Assignment", "due_date": "2023-10-25", "priority": "High"}
    "#;

    // Handle Claude/Anthropic differently (different API format)
    if provider == "claude" {
        return analyze_with_claude(client, content, api_key, config, prompt);
    }

    // Standard OpenAI-compatible API (OpenRouter, Groq, OpenAI, DeepSeek)
    let request_body = json!({
        "model": config.default_model,
        "messages": [
            {"role": "system", "content": prompt},
            {"role": "user", "content": content}
        ],
        "temperature": 0.1
    });

    let mut request = client.post(&config.base_url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json");

    // OpenRouter specific headers
    if provider == "openrouter" {
        request = request
            .header("HTTP-Referer", "http://localhost:1420")
            .header("X-Title", "Kairos App");
    }

    let response = request
        .json(&request_body)
        .send()
        .map_err(|e| format!("Network Error: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().unwrap_or_default();
        return Err(format!("API Error ({}): {}", status, error_text));
    }

    let response_json: serde_json::Value = response.json().map_err(|e| e.to_string())?;
    
    let content_text = response_json["choices"][0]["message"]["content"]
        .as_str()
        .ok_or("Invalid AI response")?;

    parse_ai_response(content_text)
}

// Special handler for Claude/Anthropic API
fn analyze_with_claude(
    client: Client, 
    content: String, 
    api_key: String, 
    config: AiProvider,
    prompt: &str
) -> Result<AiTask, String> {
    let request_body = json!({
        "model": config.default_model,
        "max_tokens": 1024,
        "system": prompt,
        "messages": [
            {"role": "user", "content": content}
        ]
    });

    let response = client.post(&config.base_url)
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .map_err(|e| format!("Network Error: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().unwrap_or_default();
        return Err(format!("Claude API Error ({}): {}", status, error_text));
    }

    let response_json: serde_json::Value = response.json().map_err(|e| e.to_string())?;
    
    let content_text = response_json["content"][0]["text"]
        .as_str()
        .ok_or("Invalid Claude response")?;

    parse_ai_response(content_text)
}

// Parse AI response to extract task
fn parse_ai_response(content_text: &str) -> Result<AiTask, String> {
    let clean_text = content_text
        .trim()
        .trim_start_matches("```json")
        .trim_start_matches("```")
        .trim_end_matches("```")
        .trim();

    let task_data: AiTask = serde_json::from_str(clean_text)
        .map_err(|e| format!("JSON Parse Error: {} | Response: {}", e, clean_text))?;

    Ok(task_data)
}

#[tauri::command]
pub fn analyze_email_with_ai(content: String, api_key: String, provider: String) -> Result<AiTask, String> {
    println!("🤖 Analyzing email with provider: {}", provider);
    analyze_email_internal(content, api_key, provider)
}

// Get available AI providers
#[tauri::command]
pub fn get_ai_providers() -> Vec<serde_json::Value> {
    vec![
        json!({
            "id": "openrouter",
            "name": "OpenRouter",
            "description": "Access multiple AI models with one API key (Recommended)",
            "placeholder": "sk-or-v1-...",
            "website": "https://openrouter.ai/keys",
            "free_tier": true
        }),
        json!({
            "id": "groq",
            "name": "Groq",
            "description": "Ultra-fast inference with Llama models",
            "placeholder": "gsk_...",
            "website": "https://console.groq.com/keys",
            "free_tier": true
        }),
        json!({
            "id": "openai",
            "name": "OpenAI",
            "description": "GPT-4o and GPT-4o-mini models",
            "placeholder": "sk-...",
            "website": "https://platform.openai.com/api-keys",
            "free_tier": false
        }),
        json!({
            "id": "deepseek",
            "name": "DeepSeek",
            "description": "Cost-effective AI with strong reasoning",
            "placeholder": "sk-...",
            "website": "https://platform.deepseek.com/api_keys",
            "free_tier": true
        }),
        json!({
            "id": "claude",
            "name": "Claude (Anthropic)",
            "description": "Advanced reasoning and analysis",
            "placeholder": "sk-ant-...",
            "website": "https://console.anthropic.com/",
            "free_tier": false
        })
    ]
}
