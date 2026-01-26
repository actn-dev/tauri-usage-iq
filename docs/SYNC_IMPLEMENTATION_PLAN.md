# 🔄 Desktop Sync Implementation Plan

## 📋 IMPLEMENTATION ORDER

Based on the existing extension sync system, here's what we need to build:

---

## **PHASE 1: Authentication & Org Selection** ⚡ START HERE

### 1.1 Add Better Auth Client to Tauri App
**Files to create**:
- `src/lib/auth.ts` - Better Auth React client
- `src/components/LoginScreen.tsx` - Login UI
- `src/components/OrgSelector.tsx` - Organization picker

**Dependencies needed**:
```bash
bun add better-auth @better-auth/react
```

**What it does**:
- User signs in with email/password (or OAuth)
- Gets session token
- Fetches user's organizations
- Stores selected org in local storage

### 1.2 Store Auth State
**Files to update**:
- Create `src/store/authStore.ts` - Zustand/Context for auth state

**What to store**:
```typescript
{
  isAuthenticated: boolean,
  user: { id, email, name },
  organizations: Org[],
  selectedOrganizationId: string | null,
  sessionToken: string,
}
```

---

## **PHASE 2: Server - Desktop Sync Endpoint** 

### 2.1 Create Database Schema
**File**: `apps/nextjs/src/server/db/schema/desktop.ts`

**Tables to create**:
```typescript
// Desktop Activity (similar to extensionActivity but for apps)
desktopActivity {
  id, userId, organizationId, deviceId,
  date, hour,           // YYYY-MM-DD, 0-23
  appName, processPath,
  activeTime, idleTime, totalTime,
  focusCount,
  windowTitles,         // JSON array
  deviceName, osName, osVersion,
  createdAt, updatedAt
}

// Desktop Session (similar to extensionSession)
desktopSession {
  id, userId, organizationId, deviceId,
  sessionId,
  startTime, endTime,
  totalActiveTime, totalIdleTime, totalTime,
  appCount, appSwitchCount,
  deviceName, osName, osVersion,
  createdAt, updatedAt
}

// Desktop Sync History
desktopSyncHistory {
  id, userId, organizationId,
  syncedAt, recordCount, dataSize,
  status, errorMessage,
  createdAt
}
```

**Indexes to add**:
- `desktop_activity_org_user_date_hour_idx`
- `desktop_activity_org_device_app_idx`
- `desktop_session_org_user_idx`

### 2.2 Create Sync Endpoint
**File**: `apps/nextjs/src/app/api/desktop/sync/route.ts`

**Similar to extension sync but adapted for**:
- Hourly activities (not domain-based)
- App names instead of domains
- Active/idle time split
- Window titles array

**Request schema**:
```typescript
{
  organizationId: string,
  activities: [{
    date: "2024-01-24",
    hour: 14,
    appName: "Visual Studio Code",
    processPath: "...",
    activeTime: 2340,
    idleTime: 180,
    totalTime: 2520,
    focusCount: 12,
    windowTitles: ["main.rs", "App.tsx"],
    deviceId: "uuid",
    deviceName: "...",
    osName: "...",
  }],
  sessions: [{
    sessionId: "uuid",
    startTime: 1705984509,
    endTime: null,
    totalActiveTime: 7200,
    totalIdleTime: 600,
    totalTime: 7800,
    appCount: 12,
    appSwitchCount: 145,
    deviceId: "uuid",
  }]
}
```

**Merge logic** (same as extension):
- Activities: ADD to existing (cumulative)
- Sessions: 
  - Ongoing (endTime=null): ADD deltas
  - Ended: REPLACE with final values

---

## **PHASE 3: Tauri App - Sync Manager**

### 3.1 Create Sync Manager
**File**: `src-tauri/src/sync_manager.rs`

**Responsibilities**:
- Read hourly_activities.json
- Read sessions.json
- Transform to API format
- Send HTTP POST to `/api/desktop/sync`
- Handle auth token
- Delta tracking for ongoing sessions
- Retry logic on failure

**Key functions**:
```rust
pub struct SyncManager {
  auth_token: Option<String>,
  last_sync_time: i64,
  sync_interval: Duration,
}

impl SyncManager {
  pub async fn sync_now(&mut self, org_id: &str) -> Result<SyncResult>
  pub async fn start_auto_sync(&mut self)
  fn collect_activities_to_sync(&self) -> Vec<HourlyActivity>
  fn collect_sessions_to_sync(&self) -> Vec<BrowserSession>
  fn mark_as_synced(&mut self, activities, sessions)
}
```

### 3.2 Add HTTP Client
**Dependencies needed**:
```toml
reqwest = { version = "0.11", features = ["json"] }
tokio = { version = "1", features = ["full"] }
```

### 3.3 Add Tauri Commands
**File**: `src-tauri/src/commands.rs`

**New commands**:
```rust
#[tauri::command]
pub async fn sync_activities(
  org_id: String,
  auth_token: String
) -> Result<SyncResult, String>

#[tauri::command]
pub async fn get_sync_status() -> Result<SyncStatus, String>

#[tauri::command]
pub async fn set_auth_token(token: String) -> Result<(), String>
```

---

## **PHASE 4: Tauri App - UI Integration**

### 4.1 Add Login Flow
**Components to create**:
- `src/screens/LoginScreen.tsx`
- `src/screens/OrgSelectScreen.tsx`

**Flow**:
1. App starts → Check if authenticated
2. If not → Show login screen
3. After login → Show org selector
4. After org selection → Show dashboard
5. Store auth + org in localStorage

### 4.2 Add Sync UI
**Files to update**:
- `src/App.tsx` - Add sync status indicator

**Add to UI**:
- "Sync Now" button in header
- Last sync time display
- Sync progress indicator
- Sync error notifications

### 4.3 Add Settings Screen
**File**: `src/screens/SettingsScreen.tsx`

**Settings to include**:
- Logout button
- Change organization
- Sync interval setting
- Privacy: Enable/disable window title tracking
- Data management: Clear local data

---

## **PHASE 5: Testing & Polish**

### 5.1 Test Scenarios
- [ ] Login with email/password
- [ ] Select organization
- [ ] Manual sync (button click)
- [ ] Auto sync (every 30 min)
- [ ] Sync with ongoing session (delta)
- [ ] Sync with ended session (final)
- [ ] Network error handling
- [ ] Token expiration handling
- [ ] Multiple devices syncing

### 5.2 Error Handling
- Network failures → Retry with exponential backoff
- Auth errors → Show login screen again
- Validation errors → Log details
- Conflict resolution → Server wins (for now)

---

## 📊 IMPLEMENTATION PRIORITY

### ⚡ **DO FIRST** (Critical Path):
1. **Auth UI in Tauri** - Login + Org selection
2. **Desktop Schema** - Database tables on server
3. **Desktop Sync Endpoint** - `/api/desktop/sync/route.ts`
4. **Sync Manager** - Rust HTTP client
5. **Wire Up UI** - Connect auth + sync

### 🔧 **DO SECOND** (Polish):
1. Settings screen
2. Auto-sync interval configuration
3. Sync history display
4. Error notifications
5. Offline queue

### 🎨 **DO LATER** (Nice-to-have):
1. Sync conflict resolution UI
2. Data export
3. Privacy controls
4. Multi-org switching
5. Background sync optimization

---

## 🚀 RECOMMENDED START

### **Start with Phase 1: Authentication**

**Why?** Without auth, we can't sync anything to server.

**Quick wins**:
1. Add Better Auth client to Tauri app (30 min)
2. Create simple login screen (1 hour)
3. Add org selector (30 min)
4. Store auth state in localStorage (15 min)
5. Test login flow end-to-end (30 min)

**Total**: ~3 hours for working auth

Then move to Phase 2 (Server) and Phase 3 (Sync Manager) in parallel.

---

## 📝 NOTES

### Differences from Extension Sync
| Aspect | Extension | Desktop |
|--------|-----------|---------|
| **Entity** | Domains (websites) | Apps (executables) |
| **Granularity** | Daily | Hourly |
| **Time Types** | Foreground/Background/Audible | Active/Idle |
| **Window Data** | Limited | Full window titles |
| **Session** | Browser open/close | Computer login/logout |

### Shared Concepts
- Device ID (UUID)
- Organization membership
- Delta sync for ongoing sessions
- Cumulative activity merging
- Sync history tracking

---

## 🎯 SUCCESS CRITERIA

Phase 1 complete when:
- ✅ User can login from Tauri app
- ✅ User can select organization
- ✅ Auth token stored and accessible

Phase 2 complete when:
- ✅ Desktop schema deployed
- ✅ `/api/desktop/sync` endpoint working
- ✅ Can POST data from Postman

Phase 3 complete when:
- ✅ Sync manager can send data
- ✅ Auth token passed in headers
- ✅ Response handled correctly

Phase 4 complete when:
- ✅ "Sync Now" button works
- ✅ Auto-sync runs every 30 min
- ✅ Sync status displayed in UI

---

## 🔄 NEXT IMMEDIATE STEPS

**Run these commands to start**:
```bash
# 1. Add auth dependencies to Tauri app
cd /home/ih/Code/nextjs/tauri-usage-iq
bun add better-auth @better-auth/react zustand

# 2. Create auth structure
mkdir -p src/lib src/components src/screens src/store

# 3. Start with Phase 1.1 - Auth Client Setup
```

**First file to create**: `src/lib/auth.ts`
