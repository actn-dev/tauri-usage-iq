mod activity_tracker;
mod device_manager;
mod idle_detector;
mod sync_manager;
mod commands;

use activity_tracker::ActivityTracker;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_app_usage_summary,
            commands::get_today_usage,
            commands::get_activity_logs,
            commands::get_current_session,
            commands::get_debug_info,
            commands::sync_to_server,
            commands::get_sync_stats
        ])
        .setup(|app| {
            let handle = app.handle().clone();
            
            // Start activity tracking
            let tracker = ActivityTracker::new(&handle);
            tauri::async_runtime::spawn(async move {
                tracker.start_tracking(handle).await;
            });
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
