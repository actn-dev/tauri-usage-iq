use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceInfo {
    pub device_id: String,
    pub device_name: String,
    pub os_name: String,
    pub os_version: String,
}

fn get_device_info_path(app: &AppHandle) -> PathBuf {
    app.path()
        .app_data_dir()
        .expect("Failed to get app data dir")
        .join("device_info.json")
}

/// Get or create device info (persisted)
pub fn get_or_create_device_info(app: &AppHandle) -> DeviceInfo {
    let path = get_device_info_path(app);

    // Try to load existing device info
    if path.exists() {
        if let Ok(content) = fs::read_to_string(&path) {
            if let Ok(info) = serde_json::from_str::<DeviceInfo>(&content) {
                return info;
            }
        }
    }

    // Create new device info
    let device_info = DeviceInfo {
        device_id: Uuid::new_v4().to_string(),
        device_name: get_device_name(),
        os_name: std::env::consts::OS.to_string(),
        os_version: get_os_version(),
    };

    // Ensure directory exists
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }

    // Save device info
    if let Ok(json) = serde_json::to_string_pretty(&device_info) {
        let _ = fs::write(&path, json);
    }

    device_info
}

fn get_device_name() -> String {
    #[cfg(target_os = "windows")]
    {
        std::env::var("COMPUTERNAME").unwrap_or_else(|_| "Unknown".to_string())
    }

    #[cfg(target_os = "macos")]
    {
        std::env::var("HOSTNAME").unwrap_or_else(|_| {
            hostname::get()
                .ok()
                .and_then(|h| h.into_string().ok())
                .unwrap_or_else(|| "Unknown".to_string())
        })
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        "Unknown".to_string()
    }
}

fn get_os_version() -> String {
    #[cfg(target_os = "windows")]
    {
        // Get Windows version
        "Windows".to_string() // Simplified
    }

    #[cfg(target_os = "macos")]
    {
        // Get macOS version
        "macOS".to_string() // Simplified
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        "Unknown".to_string()
    }
}
