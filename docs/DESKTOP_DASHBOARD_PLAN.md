# Desktop Dashboard - Implementation Plan

## 🎯 Goal
Create a minimal desktop usage dashboard similar to the extension report page.

---

## 📁 Suggested Page Structure

### Option 1: Separate Route (Recommended)
```
/org/[slug]/desktop/report
```
**Pros**:
- ✅ Clean separation (extension vs desktop)
- ✅ Independent navigation
- ✅ Easier to maintain
- ✅ Can have different layouts/features

### Option 2: Combined Route with Tabs
```
/org/[slug]/usage/report
├── Tab: Browser (extension data)
└── Tab: Desktop (desktop data)
```
**Pros**:
- ✅ All usage data in one place
- ✅ Easy comparison
- ✅ Single navigation entry

### Option 3: Unified Dashboard
```
/org/[slug]/activity/report
Shows both extension + desktop data mixed
```
**Pros**:
- ✅ Complete picture of user activity
- ✅ Combined metrics

---

## 🎨 Recommended Approach (Minimal MVP)

### **Option 1: Separate Desktop Page** ✅

**Route**: `/org/[slug]/desktop/report`

**Why?**
1. Keep existing extension page untouched
2. Desktop has different metrics (idle time, devices, apps)
3. Easier to build incrementally
4. Can merge later if needed

---

## 📂 File Structure

```
apps/nextjs/src/app/org/[slug]/
├── extension/
│   └── report/
│       └── page.tsx           # Existing - Browser extension data
├── desktop/                    # NEW
│   └── report/
│       └── page.tsx           # Desktop app usage data
└── layout.tsx                 # Add desktop link to nav
```

---

## 🎯 Minimal Desktop Dashboard - MVP

### Page: `/org/[slug]/desktop/report/page.tsx`

**Components to Build:**

#### 1. **Overview Stats** (4 cards)
```tsx
<div className="grid grid-cols-4 gap-4">
  <StatCard title="Total Time" value="8h 45m" />
  <StatCard title="Active Time" value="7h 12m" />
  <StatCard title="Apps Used" value="24" />
  <StatCard title="Devices" value="2" />
</div>
```

#### 2. **Date Picker** (reuse from extension)
```tsx
<DateRangePicker 
  from={startDate} 
  to={endDate} 
  onDateChange={handleDateChange} 
/>
```

#### 3. **Apps Usage Table**
```tsx
<Table>
  <thead>
    <tr>
      <th>App Name</th>
      <th>Device</th>
      <th>Active Time</th>
      <th>Idle Time</th>
      <th>Total Time</th>
      <th>Focus Count</th>
    </tr>
  </thead>
  <tbody>
    {apps.map(app => (
      <tr key={app.id}>
        <td>{app.appName}</td>
        <td>{app.deviceName}</td>
        <td>{formatTime(app.activeTime)}</td>
        <td>{formatTime(app.idleTime)}</td>
        <td>{formatTime(app.totalTime)}</td>
        <td>{app.focusCount}</td>
      </tr>
    ))}
  </tbody>
</Table>
```

---

## 🗄️ API Route to Create

### `/api/org/[slug]/desktop/stats/route.ts`

**Purpose**: Fetch desktop usage stats

**Query Parameters**:
- `startDate` - Start date (YYYY-MM-DD)
- `endDate` - End date (YYYY-MM-DD)
- `deviceId` - Optional device filter

**Response**:
```json
{
  "overview": {
    "totalTime": 31500,        // seconds
    "activeTime": 25920,       // seconds
    "idleTime": 5580,          // seconds
    "appsCount": 24,
    "devicesCount": 2,
    "sessionsCount": 3
  },
  "apps": [
    {
      "appName": "Visual Studio Code",
      "deviceName": "MacBook Pro",
      "activeTime": 16200,
      "idleTime": 1800,
      "totalTime": 18000,
      "focusCount": 156,
      "processPath": "/Applications/VS Code.app"
    },
    {
      "appName": "Google Chrome",
      "deviceName": "MacBook Pro",
      "activeTime": 8100,
      "idleTime": 900,
      "totalTime": 9000,
      "focusCount": 89
    }
  ],
  "hourlyData": [
    { "hour": 9, "activeTime": 3240, "idleTime": 360 },
    { "hour": 10, "activeTime": 3420, "idleTime": 180 },
    { "hour": 11, "activeTime": 3060, "idleTime": 540 }
  ],
  "devices": [
    {
      "deviceName": "MacBook Pro",
      "deviceId": "device-uuid-1",
      "totalTime": 27000,
      "appsCount": 18
    },
    {
      "deviceName": "Desktop PC",
      "deviceId": "device-uuid-2",
      "totalTime": 4500,
      "appsCount": 6
    }
  ]
}
```

---

## 📝 Database Queries

### 1. Overview Stats
```typescript
const overview = await db
  .select({
    totalTime: sql<number>`SUM(${desktopActivity.totalTime})`,
    activeTime: sql<number>`SUM(${desktopActivity.activeTime})`,
    idleTime: sql<number>`SUM(${desktopActivity.idleTime})`,
    appsCount: sql<number>`COUNT(DISTINCT ${desktopActivity.appName})`,
    devicesCount: sql<number>`COUNT(DISTINCT ${desktopActivity.deviceId})`,
  })
  .from(desktopActivity)
  .where(
    and(
      eq(desktopActivity.organizationId, orgId),
      gte(desktopActivity.date, startDate),
      lte(desktopActivity.date, endDate)
    )
  );
```

### 2. Apps Breakdown
```typescript
const apps = await db
  .select({
    appName: desktopActivity.appName,
    deviceName: desktopActivity.deviceName,
    activeTime: sql<number>`SUM(${desktopActivity.activeTime})`,
    idleTime: sql<number>`SUM(${desktopActivity.idleTime})`,
    totalTime: sql<number>`SUM(${desktopActivity.totalTime})`,
    focusCount: sql<number>`SUM(${desktopActivity.focusCount})`,
    processPath: desktopActivity.processPath,
  })
  .from(desktopActivity)
  .where(
    and(
      eq(desktopActivity.organizationId, orgId),
      gte(desktopActivity.date, startDate),
      lte(desktopActivity.date, endDate)
    )
  )
  .groupBy(desktopActivity.appName, desktopActivity.deviceName)
  .orderBy(desc(sql`SUM(${desktopActivity.totalTime})`));
```

---

## 🎨 UI Components to Reuse

From extension report:
1. ✅ **Date Picker** - Same component
2. ✅ **Stat Cards** - Same design
3. ✅ **Table** - Same styling
4. ✅ **Layout** - Same page structure

---

## 🔗 Navigation Update

Add desktop link to sidebar/nav:

**File**: `apps/nextjs/src/app/org/[slug]/layout.tsx`

```tsx
<nav>
  <NavLink href={`/org/${slug}/extension/report`}>
    Browser Usage
  </NavLink>
  <NavLink href={`/org/${slug}/desktop/report`}>    {/* NEW */}
    Desktop Usage
  </NavLink>
</nav>
```

---

## ⚡ Quick Implementation Steps

### Phase 1: Minimal MVP (1-2 hours)
1. Create `/org/[slug]/desktop/report/page.tsx`
2. Create `/api/org/[slug]/desktop/stats/route.ts`
3. Copy extension report layout
4. Display 4 overview cards
5. Display apps table
6. Add date picker
7. Add to navigation

### Phase 2: Enhancements (optional)
1. Add hourly chart
2. Add device filter
3. Add device breakdown section
4. Add session timeline
5. Add window titles tooltip

---

## 🎯 Minimal Page Preview

```
┌─────────────────────────────────────────────────────────────┐
│ Desktop Usage Report                    [Date Picker]       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 8h 45m   │  │ 7h 12m   │  │ 24 apps  │  │ 2 devices│   │
│  │Total Time│  │ Active   │  │  Used    │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ App Usage                                             │  │
│  ├───────────┬─────────┬────────┬────────┬──────┬──────┤  │
│  │ App       │ Device  │ Active │ Idle   │ Total│Focus │  │
│  ├───────────┼─────────┼────────┼────────┼──────┼──────┤  │
│  │ VS Code   │ Laptop  │ 4h 32m │ 45m    │5h 17m│ 156  │  │
│  │ Chrome    │ Laptop  │ 2h 15m │ 30m    │2h 45m│  89  │  │
│  │ Slack     │ Laptop  │ 1h 10m │ 20m    │1h 30m│  45  │  │
│  │ ...       │ ...     │ ...    │ ...    │ ...  │ ...  │  │
│  └───────────┴─────────┴────────┴────────┴──────┴──────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Benefits of Separate Page

1. **Clean Separation** - Extension vs Desktop
2. **Independent Updates** - Change one without affecting other
3. **Different Metrics** - Desktop has idle time, devices, apps
4. **Simpler to Build** - Copy extension report structure
5. **Easy to Extend** - Add charts, filters later

---

## 🚀 Recommendation

**Build**: `/org/[slug]/desktop/report` as separate page

**Start with**:
1. Overview cards (4 metrics)
2. Apps table (sortable)
3. Date picker

**Add later**:
1. Hourly chart
2. Device filter
3. Session timeline

**Total time**: ~2 hours for MVP ✅

---

## 🤔 Alternative: Tabs

If you want both in one place:

```
/org/[slug]/usage/report

┌─────────────────────────────────────────┐
│  [Browser] [Desktop]                    │  ← Tabs
├─────────────────────────────────────────┤
│  Content based on active tab            │
└─────────────────────────────────────────┘
```

**But separate pages is cleaner for MVP!**
