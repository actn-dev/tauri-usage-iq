use active_win_pos_rs::get_active_window;
use chrono::{DateTime, Timelike, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};

use crate::device_manager::{get_or_create_device_info, DeviceInfo};
use crate::idle_detector::get_system_idle_seconds;

const IDLE_THRESHOLD_SECONDS: u64 = 60; // 60 seconds to be considered idle
const FLUSH_INTERVAL_SECONDS: i64 = 300; // Flush to disk every 5 minutes

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HourlyActivity {
    pub date: String, // YYYY-MM-DD
    pub hour: u8,     // 0-23
    pub app_name: String,
    pub process_path: String,
    pub active_time: i64,           // Seconds actively using
    pub idle_time: i64,             // Seconds idle while app focused
    pub total_time: i64,            // active_time + idle_time
    pub focus_count: i32,           // Number of times app was focused
    pub window_titles: Vec<String>, // Unique window titles seen
    pub first_seen: i64,            // Unix timestamp
    pub last_seen: i64,             // Unix timestamp

    // Device info
    pub device_id: String,
    pub device_name: String,
    pub os_name: String,
    pub os_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserSession {
    pub session_id: String,
    pub device_id: String,
    pub start_time: i64,
    pub end_time: Option<i64>,
    pub total_active_time: i64,
    pub total_idle_time: i64,
    pub total_time: i64,
    pub app_count: i32,
    pub app_switch_count: i32,
}

#[derive(Debug, Clone)]
struct CurrentActivity {
    app_name: String,
    process_path: String,
    window_title: String,
    start_time: i64,
}

pub struct ActivityTracker {
    current_activity: Arc<Mutex<Option<CurrentActivity>>>,
    hourly_buffer: Arc<Mutex<HashMap<String, HourlyActivity>>>, // key: "date:hour:app_name"
    session: Arc<Mutex<Option<BrowserSession>>>,
    device_info: DeviceInfo,
    last_flush_time: Arc<Mutex<i64>>,
}

impl ActivityTracker {
    pub fn new(app: &AppHandle) -> Self {
        let device_info = get_or_create_device_info(app);

        // Start a new session
        let session = BrowserSession {
            session_id: uuid::Uuid::new_v4().to_string(),
            device_id: device_info.device_id.clone(),
            start_time: current_timestamp(),
            end_time: None,
            total_active_time: 0,
            total_idle_time: 0,
            total_time: 0,
            app_count: 0,
            app_switch_count: 0,
        };

        Self {
            current_activity: Arc::new(Mutex::new(None)),
            hourly_buffer: Arc::new(Mutex::new(HashMap::new())),
            session: Arc::new(Mutex::new(Some(session))),
            device_info,
            last_flush_time: Arc::new(Mutex::new(current_timestamp())),
        }
    }

    pub async fn start_tracking(self, app: AppHandle) {
        let tracker = Arc::new(self);

        tokio::spawn(async move {
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(1));

            loop {
                interval.tick().await;
                tracker.track_tick(&app).await;
            }
        });
    }

    async fn track_tick(&self, app: &AppHandle) {
        let now = current_timestamp();
        let idle_seconds = get_system_idle_seconds();
        let is_idle = idle_seconds >= IDLE_THRESHOLD_SECONDS;

        match get_active_window() {
            Ok(active_window) => {
                let app_name = active_window.app_name;
                let process_path = active_window.process_path.to_string_lossy().to_string();
                let window_title = active_window.title;

                // Update hourly activity
                self.update_hourly_activity(&app_name, &process_path, &window_title, now, is_idle);

                // Update current activity tracking
                let mut current = self.current_activity.lock().unwrap();
                let is_new_app = match current.as_ref() {
                    Some(activity) => activity.app_name != app_name,
                    None => true,
                };

                if is_new_app {
                    // Update session app switch count
                    if let Some(ref mut session) = *self.session.lock().unwrap() {
                        session.app_switch_count += 1;
                    }

                    *current = Some(CurrentActivity {
                        app_name,
                        process_path,
                        window_title,
                        start_time: now,
                    });
                }

                // Update session time
                if let Some(ref mut session) = *self.session.lock().unwrap() {
                    if is_idle {
                        session.total_idle_time += 1;
                    } else {
                        session.total_active_time += 1;
                    }
                    session.total_time += 1;
                }
            }
            Err(_) => {
                // No active window - system might be locked
            }
        }

        // Flush to disk periodically
        let mut last_flush = self.last_flush_time.lock().unwrap();
        if now - *last_flush >= FLUSH_INTERVAL_SECONDS {
            self.flush_to_disk(app);
            *last_flush = now;
        }
    }

    fn update_hourly_activity(
        &self,
        app_name: &str,
        process_path: &str,
        window_title: &str,
        timestamp: i64,
        is_idle: bool,
    ) {
        let date = timestamp_to_date(timestamp);
        let hour = timestamp_to_hour(timestamp);
        let key = format!("{}:{}:{}", date, hour, app_name);

        let mut buffer = self.hourly_buffer.lock().unwrap();

        let activity = buffer.entry(key).or_insert_with(|| HourlyActivity {
            date: date.clone(),
            hour,
            app_name: app_name.to_string(),
            process_path: process_path.to_string(),
            active_time: 0,
            idle_time: 0,
            total_time: 0,
            focus_count: 1,
            window_titles: vec![window_title.to_string()],
            first_seen: timestamp,
            last_seen: timestamp,
            device_id: self.device_info.device_id.clone(),
            device_name: self.device_info.device_name.clone(),
            os_name: self.device_info.os_name.clone(),
            os_version: self.device_info.os_version.clone(),
        });

        // Update times
        if is_idle {
            activity.idle_time += 1;
        } else {
            activity.active_time += 1;
        }
        activity.total_time += 1;
        activity.last_seen = timestamp;

        // Add window title if new
        if !activity.window_titles.contains(&window_title.to_string()) {
            activity.window_titles.push(window_title.to_string());
        }
    }

    fn flush_to_disk(&self, app: &AppHandle) {
        let mut buffer = self.hourly_buffer.lock().unwrap();

        if buffer.is_empty() {
            return;
        }

        let activities: Vec<HourlyActivity> = buffer.values().cloned().collect();

        // Save to file
        let path = get_hourly_activities_path(app);

        // Ensure directory exists
        if let Some(parent) = path.parent() {
            let _ = fs::create_dir_all(parent);
        }

        // Load existing activities
        let mut all_activities: Vec<HourlyActivity> = if path.exists() {
            fs::read_to_string(&path)
                .ok()
                .and_then(|content| serde_json::from_str(&content).ok())
                .unwrap_or_default()
        } else {
            Vec::new()
        };

        // Merge with existing (replace values, not add)
        for new_activity in activities {
            if let Some(existing) = all_activities.iter_mut().find(|a| {
                a.date == new_activity.date
                    && a.hour == new_activity.hour
                    && a.app_name == new_activity.app_name
                    && a.device_id == new_activity.device_id
            }) {
                // REPLACE values (buffer contains cumulative total for this hour)
                existing.active_time = new_activity.active_time;
                existing.idle_time = new_activity.idle_time;
                existing.total_time = new_activity.total_time;
                existing.focus_count = new_activity.focus_count;
                existing.last_seen = new_activity.last_seen;
                existing.first_seen = new_activity.first_seen.min(existing.first_seen);

                // Merge window titles
                for title in new_activity.window_titles {
                    if !existing.window_titles.contains(&title) {
                        existing.window_titles.push(title);
                    }
                }
            } else {
                // Add new activity
                all_activities.push(new_activity);
            }
        }

        // Write back
        if let Ok(json) = serde_json::to_string_pretty(&all_activities) {
            let _ = fs::write(&path, json);
        }

        println!("Flushed {} hourly activities to disk", buffer.len());
        
        // Clear old hour entries from buffer (keep current hour in memory)
        let now = current_timestamp();
        let current_date = timestamp_to_date(now);
        let current_hour = timestamp_to_hour(now);
        
        buffer.retain(|key, activity| {
            // Keep activities from current hour in buffer for continued tracking
            activity.date == current_date && activity.hour == current_hour
        });
    }

    pub fn end_session(&self, app: &AppHandle) {
        // Flush remaining data
        self.flush_to_disk(app);

        // End session
        if let Some(ref mut session) = *self.session.lock().unwrap() {
            session.end_time = Some(current_timestamp());

            // Save session to disk
            let path = get_sessions_path(app);

            if let Some(parent) = path.parent() {
                let _ = fs::create_dir_all(parent);
            }

            let mut sessions: Vec<BrowserSession> = if path.exists() {
                fs::read_to_string(&path)
                    .ok()
                    .and_then(|content| serde_json::from_str(&content).ok())
                    .unwrap_or_default()
            } else {
                Vec::new()
            };

            sessions.push(session.clone());

            if let Ok(json) = serde_json::to_string_pretty(&sessions) {
                let _ = fs::write(&path, json);
            }
        }
    }
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

fn current_timestamp() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64
}

fn timestamp_to_date(timestamp: i64) -> String {
    let dt = DateTime::<Utc>::from_timestamp(timestamp, 0).unwrap();
    dt.format("%Y-%m-%d").to_string()
}

fn timestamp_to_hour(timestamp: i64) -> u8 {
    let dt = DateTime::<Utc>::from_timestamp(timestamp, 0).unwrap();
    dt.hour() as u8
}
