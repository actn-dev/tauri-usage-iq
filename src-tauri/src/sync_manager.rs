use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use crate::activity_tracker::{HourlyActivity, BrowserSession};

const API_BASE_URL: &str = "http://localhost:3000";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncResult {
    pub success: bool,
    pub synced_count: i32,
    pub failed_count: i32,
    pub total_count: i32,
    pub sessions_synced: i32,
    pub activities_synced: i32,
    pub duration: i64,
}

#[derive(Debug, Serialize)]
struct ActivityPayload {
    date: String,
    hour: u8,
    #[serde(rename = "appName")]
    app_name: String,
    #[serde(rename = "processPath")]
    process_path: Option<String>,
    #[serde(rename = "activeTime")]
    active_time: i64,
    #[serde(rename = "idleTime")]
    idle_time: i64,
    #[serde(rename = "totalTime")]
    total_time: i64,
    #[serde(rename = "focusCount")]
    focus_count: i32,
    #[serde(rename = "windowTitles")]
    window_titles: Vec<String>,
    #[serde(rename = "firstSeen")]
    first_seen: i64,
    #[serde(rename = "lastSeen")]
    last_seen: i64,
    #[serde(rename = "sessionId")]
    session_id: Option<String>,
    #[serde(rename = "deviceId")]
    device_id: String,
    #[serde(rename = "deviceName")]
    device_name: Option<String>,
    #[serde(rename = "osName")]
    os_name: Option<String>,
    #[serde(rename = "osVersion")]
    os_version: Option<String>,
}

#[derive(Debug, Serialize)]
struct SessionPayload {
    #[serde(rename = "sessionId")]
    session_id: String,
    #[serde(rename = "startTime")]
    start_time: i64,
    #[serde(rename = "endTime")]
    end_time: Option<i64>,
    #[serde(rename = "totalActiveTime")]
    total_active_time: i64,
    #[serde(rename = "totalIdleTime")]
    total_idle_time: i64,
    #[serde(rename = "totalTime")]
    total_time: i64,
    #[serde(rename = "appCount")]
    app_count: i32,
    #[serde(rename = "appSwitchCount")]
    app_switch_count: i32,
    #[serde(rename = "deviceId")]
    device_id: String,
    #[serde(rename = "deviceName")]
    device_name: Option<String>,
    #[serde(rename = "osName")]
    os_name: Option<String>,
    #[serde(rename = "osVersion")]
    os_version: Option<String>,
}

#[derive(Debug, Serialize)]
struct SyncRequest {
    #[serde(rename = "organizationId")]
    organization_id: String,
    activities: Vec<ActivityPayload>,
    sessions: Vec<SessionPayload>,
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

/// Sync activities to server
pub async fn sync_activities(
    app: AppHandle,
    organization_id: String,
    session_token: String,
) -> Result<SyncResult, String> {
    // Read activities and sessions from disk
    let activities = read_hourly_activities(&app);
    let sessions = read_sessions(&app);
    
    if activities.is_empty() && sessions.is_empty() {
        return Ok(SyncResult {
            success: true,
            synced_count: 0,
            failed_count: 0,
            total_count: 0,
            sessions_synced: 0,
            activities_synced: 0,
            duration: 0,
        });
    }
    
    // Transform to API format
    let activity_payloads: Vec<ActivityPayload> = activities
        .into_iter()
        .map(|a| ActivityPayload {
            date: a.date,
            hour: a.hour,
            app_name: a.app_name,
            process_path: Some(a.process_path),
            active_time: a.active_time,
            idle_time: a.idle_time,
            total_time: a.total_time,
            focus_count: a.focus_count,
            window_titles: a.window_titles,
            first_seen: a.first_seen,
            last_seen: a.last_seen,
            session_id: None, // TODO: link to session
            device_id: a.device_id,
            device_name: Some(a.device_name),
            os_name: Some(a.os_name),
            os_version: Some(a.os_version),
        })
        .collect();
    
    let session_payloads: Vec<SessionPayload> = sessions
        .into_iter()
        .map(|s| SessionPayload {
            session_id: s.session_id,
            start_time: s.start_time,
            end_time: s.end_time,
            total_active_time: s.total_active_time,
            total_idle_time: s.total_idle_time,
            total_time: s.total_time,
            app_count: s.app_count,
            app_switch_count: s.app_switch_count,
            device_id: s.device_id,
            device_name: None, // TODO: get from device_manager
            os_name: None,
            os_version: None,
        })
        .collect();
    
    let request_body = SyncRequest {
        organization_id,
        activities: activity_payloads,
        sessions: session_payloads,
    };
    
    // Make HTTP request
    let client = reqwest::Client::new();
    let url = format!("{}/api/desktop/sync", API_BASE_URL);
    
    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .header("Cookie", format!("better-auth.session_token={}", session_token))
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Failed to send request: {}", e))?;
    
    let status = response.status();
    
    if !status.is_success() {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("Sync failed with status {}: {}", status, error_text));
    }
    
    let result: SyncResult = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    
    Ok(result)
}
