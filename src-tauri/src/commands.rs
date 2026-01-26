use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use crate::activity_tracker::{HourlyActivity, BrowserSession};
use crate::sync_manager::{self, SyncResult};

#[derive(Debug, Serialize, Deserialize)]
pub struct AppUsageSummary {
    pub app_name: String,
    pub total_duration: i64,
    pub total_active_time: i64,
    pub total_idle_time: i64,
    pub total_sessions: i64,
}

fn get_hourly_activities_path(app: &AppHandle) -> PathBuf {
    app.path()
        .app_data_dir()
        .expect("Failed to get app data dir")
        .join("hourly_activities.json")
}

fn get_sessions_path(app: &AppHandle) -> PathBuf {
    app.path()
        .app_data_dir()
        .expect("Failed to get app data dir")
        .join("sessions.json")
}

fn read_hourly_activities(app: &AppHandle) -> Vec<HourlyActivity> {
    let path = get_hourly_activities_path(app);
    
    if !path.exists() {
        return Vec::new();
    }
    
    fs::read_to_string(&path)
        .ok()
        .and_then(|content| serde_json::from_str(&content).ok())
        .unwrap_or_default()
}

fn read_sessions(app: &AppHandle) -> Vec<BrowserSession> {
    let path = get_sessions_path(app);
    
    if !path.exists() {
        return Vec::new();
    }
    
    fs::read_to_string(&path)
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
    let cutoff_date = get_date_n_days_ago(days);
    
    let activities = read_hourly_activities(&app);
    let mut usage_map: HashMap<String, (i64, i64, i64)> = HashMap::new();
    
    for activity in activities {
        if activity.date >= cutoff_date {
            let entry = usage_map.entry(activity.app_name.clone()).or_insert((0, 0, 0));
            entry.0 += activity.total_time;
            entry.1 += activity.active_time;
            entry.2 += activity.idle_time;
        }
    }
    
    let mut summaries: Vec<AppUsageSummary> = usage_map
        .into_iter()
        .map(|(app_name, (total_duration, total_active_time, total_idle_time))| AppUsageSummary {
            app_name,
            total_duration,
            total_active_time,
            total_idle_time,
            total_sessions: 1, // TODO: Count actual sessions per app
        })
        .collect();
    
    summaries.sort_by(|a, b| b.total_duration.cmp(&a.total_duration));
    
    Ok(summaries)
}

fn get_date_n_days_ago(days: i32) -> String {
    use chrono::{Duration, Utc};
    let now = Utc::now();
    let cutoff = now - Duration::days(days as i64);
    cutoff.format("%Y-%m-%d").to_string()
}

#[tauri::command]
pub async fn get_today_usage(
    app: AppHandle,
) -> Result<Vec<AppUsageSummary>, String> {
    let today = get_today_date();
    
    let activities = read_hourly_activities(&app);
    let mut usage_map: HashMap<String, (i64, i64, i64)> = HashMap::new();
    
    for activity in activities {
        if activity.date == today {
            let entry = usage_map.entry(activity.app_name.clone()).or_insert((0, 0, 0));
            entry.0 += activity.total_time;
            entry.1 += activity.active_time;
            entry.2 += activity.idle_time;
        }
    }
    
    let mut summaries: Vec<AppUsageSummary> = usage_map
        .into_iter()
        .map(|(app_name, (total_duration, total_active_time, total_idle_time))| AppUsageSummary {
            app_name,
            total_duration,
            total_active_time,
            total_idle_time,
            total_sessions: 1,
        })
        .collect();
    
    summaries.sort_by(|a, b| b.total_duration.cmp(&a.total_duration));
    
    Ok(summaries)
}

fn get_today_date() -> String {
    use chrono::Utc;
    Utc::now().format("%Y-%m-%d").to_string()
}

#[tauri::command]
pub async fn get_activity_logs(
    app: AppHandle,
    limit: Option<usize>,
) -> Result<Vec<HourlyActivity>, String> {
    let mut activities = read_hourly_activities(&app);
    
    // Sort by date and hour descending (most recent first)
    activities.sort_by(|a, b| {
        let a_key = format!("{}:{:02}", a.date, a.hour);
        let b_key = format!("{}:{:02}", b.date, b.hour);
        b_key.cmp(&a_key)
    });
    
    // Apply limit if specified
    if let Some(limit) = limit {
        activities.truncate(limit);
    }
    
    Ok(activities)
}

#[tauri::command]
pub async fn get_current_session(
    app: AppHandle,
) -> Result<Option<BrowserSession>, String> {
    let sessions = read_sessions(&app);
    
    // Get the most recent session
    Ok(sessions.into_iter().last())
}

#[tauri::command]
pub async fn get_debug_info(
    app: AppHandle,
) -> Result<serde_json::Value, String> {
    let activities = read_hourly_activities(&app);
    let sessions = read_sessions(&app);
    let hourly_path = get_hourly_activities_path(&app);
    let sessions_path = get_sessions_path(&app);
    
    let debug_info = serde_json::json!({
        "total_hourly_activities": activities.len(),
        "total_sessions": sessions.len(),
        "hourly_activities_path": hourly_path.to_string_lossy(),
        "sessions_path": sessions_path.to_string_lossy(),
        "recent_activities": activities.iter().rev().take(5).collect::<Vec<_>>(),
        "current_session": sessions.last(),
        "unique_apps": activities.iter()
            .map(|a| a.app_name.clone())
            .collect::<std::collections::HashSet<_>>()
            .len(),
    });
    
    Ok(debug_info)
}

// Sync commands
#[tauri::command]
pub async fn sync_to_server(
    app: AppHandle,
    organization_id: String,
    session_token: String,
) -> Result<SyncResult, String> {
    sync_manager::sync_activities(app, organization_id, session_token).await
}

#[tauri::command]
pub async fn get_sync_stats(app: AppHandle) -> Result<serde_json::Value, String> {
    let activities = read_hourly_activities(&app);
    let sessions = read_sessions(&app);
    
    Ok(serde_json::json!({
        "pending_activities": activities.len(),
        "pending_sessions": sessions.len(),
        "total_pending": activities.len() + sessions.len(),
    }))
}
