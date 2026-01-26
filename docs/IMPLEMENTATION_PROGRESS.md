# Tauri Desktop Tracker - Implementation Progress

## ✅ COMPLETED (Phase 1: Core Tracking)

### 1. Enhanced Activity Tracking
- ✅ Created `HourlyActivity` struct for hourly aggregation
- ✅ Created `SessionData` struct for session tracking
- ✅ Implemented `ActivityTracker` with in-memory buffering
- ✅ Added device ID generation (persistent UUID)
- ✅ Added system info collection (OS name, version, device name)

### 2. Idle Detection
- ✅ Implemented Windows idle detection (`GetLastInputInfo`)
- ✅ Implemented macOS idle detection (`CGEventSource`)
- ✅ Implemented Linux idle detection (X11 `XScreenSaverQueryInfo`)
- ✅ 60-second idle threshold

### 3. Improved Storage
- ✅ Changed from per-event to hourly aggregation
- ✅ Separate files: `device_info.json`, `hourly_activities.json`, `current_session.json`
- ✅ Flush to disk every 5 minutes (instead of every 3 seconds)
- ✅ Track window titles per hour (deduplicated)

### 4. Session Management
- ✅ Session starts on app launch
- ✅ Tracks: `active_time`, `idle_time`, `total_time`
- ✅ Tracks: `app_count`, `app_switch_count`, `focus_events`
- ✅ Session end on app close (automatic)

### 5. Updated Commands
- ✅ `get_today_usage()` - Returns hourly aggregated data
- ✅ `get_activity_logs()` - Returns hourly activities with all metadata
- ✅ `get_tracker_debug()` - Debug info with device details

### 6. Updated UI
- ✅ Shows `active_time` and `idle_time` separately
- ✅ Shows hourly activities with date/hour/device info
- ✅ Shows window titles in activity logs
- ✅ Shows device info in debug panel

## 🔄 IN PROGRESS

### Testing
- Running `bun run tauri dev` to verify implementation
- Need to check if data is being collected correctly

## 📋 NEXT STEPS (Phase 2: Sync & Server)

### 1. Authentication & Organization
- [ ] Add login UI (Better Auth integration)
- [ ] Store `userId` and `organizationId` in app state
- [ ] Add settings page for organization selection

### 2. Sync Manager
- [ ] Create `sync_manager.rs` module
- [ ] Implement sync logic (similar to extension's `syncManager.ts`)
- [ ] Sync every 30 minutes (configurable)
- [ ] Track `last_synced_at` timestamp per hour

### 3. Server API Endpoint
- [ ] Create `/api/desktop/sync` route in Next.js app
- [ ] Schema: `desktopActivity` and `desktopSession` tables
- [ ] Validate incoming data (Zod schema)
- [ ] Store in database (Drizzle ORM)

### 4. Database Schema
```typescript
// desktopActivity
{
  userId, organizationId, deviceId,
  date, hour, appName, processPath,
  activeTime, idleTime, totalTime, focusCount,
  windowTitles, firstSeen, lastSeen,
  osName, osVersion, deviceName
}

// desktopSession
{
  userId, organizationId, deviceId,
  sessionId, startTime, endTime,
  totalActiveTime, totalIdleTime,
  appCount, appSwitchCount
}
```

### 5. Sync Data Format
```json
{
  "organizationId": "uuid",
  "deviceId": "uuid",
  "activities": [
    {
      "date": "2024-01-24",
      "hour": 10,
      "appName": "VS Code",
      "activeTime": 3000,
      "idleTime": 300,
      ...
    }
  ],
  "sessions": [
    {
      "sessionId": "uuid",
      "startTime": 1705984000,
      "endTime": null,
      "totalActiveTime": 7200,
      ...
    }
  ]
}
```

## 📊 Phase 3: UI Improvements (Later)

- [ ] Dashboard with real-time stats
- [ ] Timeline view
- [ ] Weekly analytics
- [ ] App categorization
- [ ] Settings page

## 🎯 Current Focus

**Testing Phase 1 implementation** - Verify that hourly aggregation, idle detection, and session tracking work correctly.
