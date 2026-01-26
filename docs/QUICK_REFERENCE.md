# 🚀 Quick Reference

## Run the App
```bash
cd /home/ih/Code/nextjs/tauri-usage-iq
bun run tauri dev
```

## What You'll See
- **Beautiful dashboard** with gradient dark theme
- **3 stats cards**: Active Time (green), Idle Time (yellow), Total Time (blue)
- **Top 5 apps** with progress bars and percentages
- **Recent activity** feed showing last 10 hours
- **Auto-refresh** every 10 seconds

## How It Works
1. Polls active window every **1 second**
2. Detects idle state after **60 seconds** of inactivity
3. Aggregates data into **hourly buckets**
4. Saves to disk every **5 minutes**
5. Displays real-time stats in dashboard

## Data Files Location
All stored locally in app data directory:
- `hourly_activities.json` - Hourly app usage aggregates
- `sessions.json` - Computer usage sessions
- `device_info.json` - Persistent device ID

## Key Features
✅ Idle detection (Windows/macOS)
✅ Hourly aggregation (efficient)
✅ Active vs idle time separation
✅ Device ID persistence
✅ Modern React UI
✅ Auto-refresh
✅ Session tracking

## What's NOT Done Yet
❌ Server sync (Phase 3)
❌ Authentication
❌ Timeline view
❌ Charts/analytics
❌ Settings screen
❌ Break reminders

## Next Steps (Phase 3)
1. Create `/api/desktop/sync` endpoint on server
2. Build sync manager in Tauri app
3. Add authentication flow
4. Implement delta sync

## Documentation
- `WORK_SUMMARY.md` - Full work summary
- `DESKTOP_MVP_SUMMARY.md` - MVP details
- `PROGRESS.md` - Task tracker
- `README_DESKTOP.md` - User README

## MVP Status
✅ **COMPLETE** - Fully functional desktop tracker with beautiful UI!
