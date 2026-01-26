# 🖥️ Usage IQ - Desktop Activity Tracker

> Beautiful desktop application to track your computer usage with idle detection and real-time analytics.

![Status](https://img.shields.io/badge/Status-MVP_Complete-brightgreen)
![Platform](https://img.shields.io/badge/Platform-Windows%20|%20macOS%20|%20Linux-blue)
![Tech](https://img.shields.io/badge/Tech-Rust%20+%20React-orange)

## ✨ Features

### ⚡ Smart Tracking
- **1-second precision** polling of active applications
- **Automatic idle detection** (60-second threshold)
- **Hourly aggregation** for efficient storage
- **Separate active/idle time** tracking
- **Window title collection** (privacy-optional)
- **Session management** with app switch counting

### 🎨 Beautiful UI
- **Modern dark theme** with gradient backgrounds
- **Real-time dashboard** with auto-refresh
- **3 stats cards**: Active, Idle, and Total time
- **Top apps visualization** with progress bars
- **Recent activity feed** with detailed metrics
- **Smooth animations** and hover effects

### 🔒 Privacy First
- All data stored **locally** on your machine
- Server sync is **optional**
- Device ID is **persistent** but anonymous
- Window titles can be **disabled**

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Run development mode
bun run tauri dev

# Build for production
bun run tauri build
```

## 📊 What It Tracks

| Metric | Description |
|--------|-------------|
| **Active Time** | Time actively using computer (green) |
| **Idle Time** | Time computer idle/away (yellow) |
| **Total Time** | Combined active + idle time |
| **App Usage** | Per-app breakdown with percentages |
| **Focus Count** | How many times you switched to each app |
| **Window Titles** | What you were working on (optional) |
| **Sessions** | Login to logout boundaries |

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│         React Dashboard             │
│    (Vite + Tailwind + Lucide)      │
└────────────┬────────────────────────┘
             │ Tauri IPC
┌────────────▼────────────────────────┐
│      Rust Backend (Tauri)          │
│  ┌──────────────────────────────┐  │
│  │  Activity Tracker            │  │
│  │  - 1s polling loop           │  │
│  │  - Idle detection            │  │
│  │  - Hourly aggregation        │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  Storage Manager             │  │
│  │  - hourly_activities.json    │  │
│  │  - sessions.json             │  │
│  │  - device_info.json          │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

## 📁 Data Files

All data stored in app data directory:

### `hourly_activities.json`
Aggregated app usage per hour:
- Date, hour, app name
- Active vs idle time
- Focus count, window titles
- Device info

### `sessions.json`
Computer usage sessions:
- Session start/end times
- Total active/idle time
- App count, switch count

### `device_info.json`
Persistent device identification:
- Unique device ID (UUID)
- Device name, OS info

## 🎯 Current Status

✅ **Phase 1 Complete**: Core tracking system
✅ **Phase 2 Complete**: Modern dashboard UI
🚧 **Phase 3 In Progress**: Server sync integration

## 📈 Next Steps

1. **Server Integration**
   - Create `/api/desktop/sync` endpoint
   - Implement sync manager
   - Add authentication

2. **Additional UI**
   - Timeline view (visual activity timeline)
   - Charts (weekly/monthly trends)
   - Settings screen (preferences)

3. **Advanced Features**
   - Break reminders
   - Productivity scoring
   - Category auto-detection

## 🛠️ Tech Stack

**Backend**: Rust, Tauri 2, chrono, uuid, serde  
**Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons  
**Platform**: Windows (native APIs), macOS (CoreGraphics), Linux

## 📸 Screenshots

### Dashboard
- Real-time stats cards
- Top 5 applications with progress bars
- Recent activity feed
- Auto-refresh every 10 seconds

### Data Visualization
- Color-coded time types (green=active, yellow=idle)
- Percentage-based progress bars
- Smooth transitions and animations

## 🔧 Development

```bash
# Check Rust code
cargo check --manifest-path src-tauri/Cargo.toml

# Format code
cargo fmt --manifest-path src-tauri/Cargo.toml

# Run tests
cargo test --manifest-path src-tauri/Cargo.toml
```

## 📝 Documentation

- `PROGRESS.md` - Development progress tracker
- `DESKTOP_MVP_SUMMARY.md` - Detailed MVP summary
- `README_DESKTOP.md` - This file

## 🤝 Contributing

This is part of the UsageIQ platform for tracking browser + desktop usage.

## 📄 License

See LICENSE file in repository root.

---

**Built with ❤️ using Rust + React**
