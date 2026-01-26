# Desktop Dashboard Route - Under Extension

## 🎯 Decision

Keep desktop route under extension namespace:
```
/org/[slug]/extension/desktop
```

Not a separate top-level route.

---

## 📁 File Structure

```
apps/nextjs/src/app/org/[slug]/extension/
├── report/
│   └── page.tsx              # Existing - Browser usage
├── desktop/                   # NEW - Desktop usage
│   └── page.tsx              # Desktop app usage
├── blocking/
│   └── page.tsx              # Existing - Blocking rules
├── settings/
│   └── page.tsx              # Existing - Settings
└── layout.tsx                # Sidebar with all links
```

---

## 🔗 Sidebar Navigation Structure

```tsx
Extension Sidebar:
├── 📊 Report (Browser)       → /org/[slug]/extension/report
├── 💻 Desktop                → /org/[slug]/extension/desktop     ← NEW
├── 🚫 Blocking               → /org/[slug]/extension/blocking
└── ⚙️  Settings              → /org/[slug]/extension/settings
```

---

## 🎯 Benefits of This Approach

1. ✅ **Consistent Structure** - All usage tracking under `/extension`
2. ✅ **Single Sidebar** - All related features in one place
3. ✅ **Easy Navigation** - Users see browser + desktop together
4. ✅ **Shared Layout** - Reuse extension layout component
5. ✅ **Logical Grouping** - "Extension" becomes "Usage Tracking" section

---

## 📂 Implementation Plan

### 1. Create Desktop Page
```
/apps/nextjs/src/app/org/[slug]/extension/desktop/page.tsx
```

### 2. Update Sidebar
```
/apps/nextjs/src/app/org/[slug]/extension/layout.tsx
```

Add "Desktop" link between "Report" and "Blocking"

### 3. Create API Route
```
/apps/nextjs/src/app/api/org/[slug]/desktop/stats/route.ts
```

---

## 🎨 Page Structure

### `/org/[slug]/extension/desktop/page.tsx`

```tsx
export default async function DesktopPage({ params }) {
  const { slug } = params;
  
  // Similar structure to extension/report
  return (
    <div>
      <PageHeader 
        title="Desktop Usage" 
        subtitle="Track desktop application usage across devices"
      />
      
      <DateRangePicker />
      
      <OverviewCards>
        <StatCard title="Total Time" />
        <StatCard title="Active Time" />
        <StatCard title="Apps Used" />
        <StatCard title="Devices" />
      </OverviewCards>
      
      <AppsTable />
    </div>
  );
}
```

---

## 🔗 Sidebar Update

### Current Sidebar (extension/layout.tsx)
```tsx
<Sidebar>
  <NavLink href={`/org/${slug}/extension/report`}>
    📊 Report
  </NavLink>
  <NavLink href={`/org/${slug}/extension/blocking`}>
    🚫 Blocking
  </NavLink>
  <NavLink href={`/org/${slug}/extension/settings`}>
    ⚙️ Settings
  </NavLink>
</Sidebar>
```

### Updated Sidebar
```tsx
<Sidebar>
  <NavLink href={`/org/${slug}/extension/report`}>
    📊 Browser Usage
  </NavLink>
  
  <NavLink href={`/org/${slug}/extension/desktop`}>  {/* NEW */}
    💻 Desktop Usage
  </NavLink>
  
  <NavLink href={`/org/${slug}/extension/blocking`}>
    🚫 Blocking
  </NavLink>
  
  <NavLink href={`/org/${slug}/extension/settings`}>
    ⚙️ Settings
  </NavLink>
</Sidebar>
```

---

## 📊 Desktop Page Layout (Minimal MVP)

```
┌────────────────────────────────────────────────────────────┐
│ Extension Sidebar │ Desktop Usage                          │
├───────────────────┼────────────────────────────────────────┤
│ 📊 Browser Usage  │  Desktop Usage Report                  │
│ 💻 Desktop Usage  │  [Date Picker: Jan 1 - Jan 7]         │
│ 🚫 Blocking       │                                        │
│ ⚙️  Settings      │  ┌────────┬────────┬────────┬────────┐│
│                   │  │ 8h 45m │ 7h 12m │ 24 apps│2 device││
│                   │  │ Total  │ Active │  Used  │        ││
│                   │  └────────┴────────┴────────┴────────┘│
│                   │                                        │
│                   │  App Usage                             │
│                   │  ┌────────┬────────┬────────┬────────┐│
│                   │  │ App    │ Device │ Active │ Total  ││
│                   │  ├────────┼────────┼────────┼────────┤│
│                   │  │ VS Code│ Laptop │ 4h 32m │ 5h 17m ││
│                   │  │ Chrome │ Laptop │ 2h 15m │ 2h 45m ││
│                   │  │ Slack  │ Laptop │ 1h 10m │ 1h 30m ││
│                   │  └────────┴────────┴────────┴────────┘│
└───────────────────┴────────────────────────────────────────┘
```

---

## ✅ Files to Create/Update

### Create:
1. ✅ `/app/org/[slug]/extension/desktop/page.tsx` - Main desktop page
2. ✅ `/api/org/[slug]/desktop/stats/route.ts` - API endpoint

### Update:
1. ✅ `/app/org/[slug]/extension/layout.tsx` - Add desktop link to sidebar

---

## 🎯 Naming Convention

Since everything is under `/extension`:
- **"Browser Usage"** - Extension report (not just "Report")
- **"Desktop Usage"** - Desktop tracking
- Makes it clear these are two different tracking sources

---

## 🚀 Quick Implementation Checklist

```
□ Create /extension/desktop/page.tsx
□ Create /api/org/[slug]/desktop/stats/route.ts  
□ Update /extension/layout.tsx sidebar
□ Add "Desktop Usage" link
□ Query desktop_activity table
□ Display overview cards
□ Display apps table
□ Add date picker
□ Test navigation
```

---

## 💡 Future Consideration

As the app grows, you might rename:
```
/org/[slug]/extension  →  /org/[slug]/usage
```

But for now, keeping under `/extension` is fine since:
- It's where users already go for tracking
- Sidebar groups all usage features together
- Consistent with existing structure

---

## ✅ Result

**Route**: `/org/[slug]/extension/desktop`
**Sidebar**: Add between "Browser Usage" and "Blocking"
**Layout**: Reuse extension layout
**Style**: Copy browser usage page structure

Simple, clean, consistent! 🎯
