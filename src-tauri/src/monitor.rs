use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use crate::{email, ai, db, send_custom_notification};

pub fn start_background_monitor(app: AppHandle) {
    thread::spawn(move || {
        let mut last_email_id = 0;

        loop {
            println!("🕵️ Monitor: Checking inbox...");

            let email_res = db::get_setting("email");
            let pass_res = db::get_setting("password");
            let server_res = db::get_setting("server");
            let api_key_res = db::get_setting("api_key");

            if let (Ok(email), Ok(pass), Ok(server), Ok(api_key)) = (email_res, pass_res, server_res, api_key_res) {
                
                // Notification setting check
                let notifications_enabled = db::get_setting("notifications_enabled")
                    .map(|v| v != "false")
                    .unwrap_or(true);
                
                let rt = tokio::runtime::Runtime::new().unwrap();
                let fetch_result = rt.block_on(email::fetch_recent_emails(email.clone(), pass.clone(), server.clone()));

                if let Ok(emails) = fetch_result {

                    let _ = app.emit("emails-updated", &emails);

                    if let Some(newest_email) = emails.first() {
                        if newest_email.id > last_email_id && last_email_id != 0 {
                            
                            println!("✨ New Email Found: {}", newest_email.subject);

                            //AI Analysis
                            println!("🤖 Analyzing with AI...");
                            let ai_result = ai::analyze_email_internal(newest_email.body.chars().take(4000).collect(), api_key.clone());

                            match ai_result {
                                Ok(task) => {
                                    if task.found_task {
                                        let _ = db::add_task(task.title.clone(), task.due_date.clone());
                                        
                                        let _ = app.emit("task-created", &task);
                                        
                                        if notifications_enabled {
                                            send_custom_notification(
                                                &app, 
                                                "task", 
                                                "✅ Auto-Task Created!", 
                                                &format!("Task: {}\nDue: {}", task.title, task.due_date)
                                            );
                                        }
                                            
                                        println!("✅ Task Saved: {}", task.title);
                                    } else {
                                        if notifications_enabled {
                                            send_custom_notification(
                                                &app, 
                                                "email", 
                                                "📩 New Email", 
                                                &newest_email.subject
                                            );
                                        }
                                    }
                                },
                                Err(e) => {
                                    println!("❌ AI Analysis Failed: {}", e);
                                    if notifications_enabled {
                                        send_custom_notification(
                                            &app, 
                                            "email", 
                                            "📩 New Email", 
                                            &newest_email.subject
                                        );
                                    }
                                }
                            }
                        }
                        last_email_id = newest_email.id;
                    }
                }
            } else {
                println!("⚠️ Settings missing in DB. Waiting for user setup...");
            }

            thread::sleep(Duration::from_secs(120));
        }
    });
}