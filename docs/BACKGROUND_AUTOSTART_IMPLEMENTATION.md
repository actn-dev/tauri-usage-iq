# Background Running & Auto-Start Implementation

## Overview
This document describes the implementation of background running and auto-start features for the Tauri Usage IQ desktop application.

## Features Implemented

### 1. System Tray Icon
- **Location**: System tray/notification area
- **Icon**: Uses app's default icon
- **Title**: "Usage IQ"

#### Tray Menu Options:
- **Show/Hide**: Toggle window visibility
- **Settings**: Open settings page
- **Quit**: Exit the application completely

#### Interactions:
- **Left Click on Tray**: Toggle window visibility
- **Right Click on Tray**: Show menu

### 2. Background Running
- App continues tracking activity even when window is closed
- Closing the window minimizes to tray instead of quitting
- Activity tracker runs continuously in the background
- Full quit only through tray menu "Quit" option

### 3. Auto-Start on Login
- Cross-platform auto-start support (Windows, macOS, Linux)
- Configurable via Settings UI
- Starts minimized to tray when auto-started
- Uses `--minimized` flag to detect auto-start

## Technical Implementation

### Dependencies Added
```toml
tauri-plugin-autostart = "2"
tauri-plugin-tray = "2"
```

### Rust Backend

#### System Tray ([lib.rs](../src-tauri/src/lib.rs))
- Initializes tray icon with menu
- Handles menu events (show/hide, settings, quit)
- Intercepts window close events to hide instead of quit
- Detects `--minimized` flag for auto-start behavior

#### Auto-Start Commands ([commands.rs](../src-tauri/src/commands.rs))
Three new Tauri commands:
- `is_autostart_enabled()` - Check if auto-start is enabled
- `enable_autostart()` - Enable auto-start on login
- `disable_autostart()` - Disable auto-start on login

### Frontend

#### Settings UI ([Settings.tsx](../src/components/pages/Settings.tsx))
- New "System" section with:
  - **Run in Background**: Always active indicator
  - **Start on Login**: Toggle switch
- Auto-checks current auto-start status on load
- Displays error messages if operations fail
- User-friendly toggle interface

## Configuration

### Tauri Config ([tauri.conf.json](../src-tauri/tauri.conf.json))
```json
{
  "app": {
    "trayIcon": {
      "id": "main",
      "iconPath": "icons/icon.png",
      "iconAsTemplate": true,
      "menuOnLeftClick": false,
      "title": "Usage IQ"
    }
  }
}
```

### Auto-Start Plugin Initialization
```rust
.plugin(tauri_plugin_autostart::init(
    tauri_plugin_autostart::MacosLauncher::LaunchAgent,
    Some(vec!["--minimized"]),
))
```

## User Guide

### How to Use

1. **Background Running**:
   - Close the window normally (X button)
   - App minimizes to system tray
   - Activity tracking continues
   - Click tray icon to restore window

2. **Enable Auto-Start**:
   - Open app
   - Navigate to Settings
   - Find "System" section
   - Toggle "Start on Login" switch

3. **Disable Auto-Start**:
   - Go to Settings
   - Toggle "Start on Login" switch off

4. **Fully Quit App**:
   - Right-click tray icon
   - Click "Quit"

### Platform-Specific Behavior

#### Windows
- Tray icon appears in notification area (bottom-right)
- Auto-start uses Windows Task Scheduler
- Registry key: `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`

#### macOS
- Tray icon appears in menu bar (top-right)
- Auto-start uses Launch Agent
- Location: `~/Library/LaunchAgents/`

#### Linux
- Tray icon location varies by desktop environment
- Auto-start uses XDG autostart
- Location: `~/.config/autostart/`

## Benefits

### For Continuous Tracking
- ✅ Never miss activity data
- ✅ Seamless background operation
- ✅ Non-intrusive user experience
- ✅ Automatic startup after reboot

### For User Experience
- ✅ Quick access via system tray
- ✅ No need to manually start app
- ✅ Minimal resource usage when hidden
- ✅ Easy to configure

## Future Enhancements

Possible future improvements:
1. Notification on first minimize to tray
2. Tray icon badge with today's active time
3. Quick stats in tray menu
4. Start minimized setting (independent of auto-start)
5. Keyboard shortcuts for show/hide
6. Custom tray icon states (active/idle/syncing)

## Testing

### Manual Testing Steps
1. **Tray Icon Test**:
   - Start app
   - Verify tray icon appears
   - Right-click to see menu
   - Test each menu option

2. **Background Running Test**:
   - Open app
   - Close window (X button)
   - Verify app still in tray
   - Verify tracking continues
   - Click tray icon to restore

3. **Auto-Start Test**:
   - Enable auto-start in settings
   - Log out and log back in
   - Verify app starts automatically
   - Verify app starts minimized to tray

4. **Quit Test**:
   - Right-click tray icon
   - Click "Quit"
   - Verify app fully exits
   - Verify no tray icon remains

## Troubleshooting

### Tray Icon Not Appearing
- Check system tray settings (may be hidden)
- Windows: Check notification area settings
- macOS: Check menu bar configuration
- Linux: Ensure tray support in DE

### Auto-Start Not Working
- Verify toggle is enabled in Settings
- Check platform-specific auto-start location
- Ensure app has necessary permissions
- Re-toggle the setting to re-register

### App Not Starting Minimized
- Verify auto-start is enabled
- Check for `--minimized` flag in autostart entry
- Restart system after enabling auto-start

## Developer Notes

### Window Management
- Main window ID: `"main"`
- Window visibility toggled via tray events
- Close event intercepted with `api.prevent_close()`

### State Management
- Auto-start state managed by platform OS
- No local state storage needed
- Query state via Tauri commands

### Error Handling
- Commands return `Result<T, String>`
- Errors displayed in Settings UI
- Console logs for debugging
