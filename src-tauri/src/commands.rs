use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ActivityLog {
    pub app_name: String,
    pub process_path: String,
    pub window_title: String,
    pub start_time: i64,
    pub end_time: i64,
    pub duration: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AppUsageSummary {
    pub app_name: String,
    pub total_duration: i64,
    pub total_sessions: i64,
}

fn get_log_file_path(app: &AppHandle) -> std::path::PathBuf {
    app.path()
        .app_data_dir()
        .expect("Failed to get app data dir")
        .join("activity_log.json")
}

fn read_logs(app: &AppHandle) -> Vec<ActivityLog> {
    let log_path = get_log_file_path(app);
    
    if !log_path.exists() {
        return Vec::new();
    }
    
    fs::read_to_string(&log_path)
        .ok()
        .and_then(|content| serde_json::from_str(&content).ok())
        .unwrap_or_default()
}

#[tauri::command]
pub async fn get_app_usage_summary(
    app: AppHandle,
    days: Option<i32>,
) -> Result<Vec<AppUsageSummary>, String> {
    let days = days.unwrap_or(7);
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;
    let cutoff = now - (days as i64 * 86400);
    
    let logs = read_logs(&app);
    let mut usage_map: HashMap<String, (i64, i64)> = HashMap::new();
    
    for log in logs {
        if log.start_time >= cutoff {
            let entry = usage_map.entry(log.app_name.clone()).or_insert((0, 0));
            entry.0 += log.duration;
            entry.1 += 1;
        }
    }
    
    let mut summaries: Vec<AppUsageSummary> = usage_map
        .into_iter()
        .map(|(app_name, (total_duration, total_sessions))| AppUsageSummary {
            app_name,
            total_duration,
            total_sessions,
        })
        .collect();
    
    summaries.sort_by(|a, b| b.total_duration.cmp(&a.total_duration));
    
    Ok(summaries)
}

#[tauri::command]
pub async fn get_today_usage(
    app: AppHandle,
) -> Result<Vec<AppUsageSummary>, String> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;
    
    // Start of today (midnight UTC)
    let today_start = now - (now % 86400);
    
    let logs = read_logs(&app);
    let mut usage_map: HashMap<String, (i64, i64)> = HashMap::new();
    
    for log in logs {
        if log.start_time >= today_start {
            let entry = usage_map.entry(log.app_name.clone()).or_insert((0, 0));
            entry.0 += log.duration;
            entry.1 += 1;
        }
    }
    
    let mut summaries: Vec<AppUsageSummary> = usage_map
        .into_iter()
        .map(|(app_name, (total_duration, total_sessions))| AppUsageSummary {
            app_name,
            total_duration,
            total_sessions,
        })
        .collect();
    
    summaries.sort_by(|a, b| b.total_duration.cmp(&a.total_duration));
    
    Ok(summaries)
}

#[tauri::command]
pub async fn get_activity_logs(
    app: AppHandle,
    limit: Option<usize>,
) -> Result<Vec<ActivityLog>, String> {
    let mut logs = read_logs(&app);
    
    // Sort by start_time descending (most recent first)
    logs.sort_by(|a, b| b.start_time.cmp(&a.start_time));
    
    // Apply limit if specified
    if let Some(limit) = limit {
        logs.truncate(limit);
    }
    
    Ok(logs)
}

#[tauri::command]
pub async fn get_debug_info(
    app: AppHandle,
) -> Result<serde_json::Value, String> {
    let logs = read_logs(&app);
    let log_path = get_log_file_path(&app);
    
    let debug_info = serde_json::json!({
        "total_logs": logs.len(),
        "log_file_path": log_path.to_string_lossy(),
        "log_file_exists": log_path.exists(),
        "recent_logs": logs.iter().rev().take(10).collect::<Vec<_>>(),
        "unique_apps": logs.iter()
            .map(|l| l.app_name.clone())
            .collect::<std::collections::HashSet<_>>()
            .len(),
    });
    
    Ok(debug_info)
}
