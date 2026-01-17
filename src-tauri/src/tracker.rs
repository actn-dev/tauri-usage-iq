use active_win_pos_rs::get_active_window;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ActivityLog {
    app_name: String,
    process_path: String,
    window_title: String,
    start_time: i64,
    end_time: i64,
    duration: i64,
}

#[derive(Debug, Clone)]
struct CurrentActivity {
    app_name: String,
    process_path: String,
    window_title: String,
    start_time: i64,
}

fn get_log_file_path(app: &AppHandle) -> PathBuf {
    app.path()
        .app_data_dir()
        .expect("Failed to get app data dir")
        .join("activity_log.json")
}

fn append_log(app: &AppHandle, log: ActivityLog) {
    let log_path = get_log_file_path(app);
    
    // Ensure directory exists
    if let Some(parent) = log_path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    
    // Read existing logs
    let mut logs: Vec<ActivityLog> = if log_path.exists() {
        fs::read_to_string(&log_path)
            .ok()
            .and_then(|content| serde_json::from_str(&content).ok())
            .unwrap_or_default()
    } else {
        Vec::new()
    };
    
    logs.push(log);
    
    // Write back
    if let Ok(json) = serde_json::to_string_pretty(&logs) {
        let _ = fs::write(&log_path, json);
    }
}

fn update_last_log(app: &AppHandle, end_time: i64, duration: i64) {
    let log_path = get_log_file_path(app);
    
    if !log_path.exists() {
        return;
    }
    
    let mut logs: Vec<ActivityLog> = fs::read_to_string(&log_path)
        .ok()
        .and_then(|content| serde_json::from_str(&content).ok())
        .unwrap_or_default();
    
    if let Some(last) = logs.last_mut() {
        last.end_time = end_time;
        last.duration = duration;
    }
    
    if let Ok(json) = serde_json::to_string_pretty(&logs) {
        let _ = fs::write(&log_path, json);
    }
}

pub async fn start_tracking(app: AppHandle) {
    let current_activity: Arc<Mutex<Option<CurrentActivity>>> = Arc::new(Mutex::new(None));
    
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(3));
        
        loop {
            interval.tick().await;
            
            match get_active_window() {
                Ok(active_window) => {
                    let now = SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_secs() as i64;
                    
                    let app_name = active_window.app_name;
                    let process_path = active_window.process_path.to_string_lossy().to_string();
                    let window_title = active_window.title;
                    
                    let mut current = current_activity.lock().unwrap();
                    
                    match current.as_ref() {
                        Some(activity) if activity.app_name == app_name => {
                            // Same app - update duration
                            let duration = now - activity.start_time;
                            update_last_log(&app, now, duration);
                        }
                        _ => {
                            // Different app or first run
                            if let Some(prev) = current.as_ref() {
                                // Update previous activity final duration
                                let prev_duration = now - prev.start_time;
                                update_last_log(&app, now, prev_duration);
                            }
                            
                            // Start tracking new activity
                            append_log(&app, ActivityLog {
                                app_name: app_name.clone(),
                                process_path: process_path.clone(),
                                window_title: window_title.clone(),
                                start_time: now,
                                end_time: now,
                                duration: 0,
                            });
                            
                            *current = Some(CurrentActivity {
                                app_name,
                                process_path,
                                window_title,
                                start_time: now,
                            });
                        }
                    }
                }
                Err(()) => {
                    eprintln!("Failed to get active window");
                }
            }
        }
    });
}
