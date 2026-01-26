import { invoke } from "@tauri-apps/api/core";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import "./App.css";
import { Sidebar } from "./components/Sidebar";
import { Login } from "./components/login";
import { ActivityTimeline } from "./components/pages/ActivityTimeline";
import { Applications } from "./components/pages/Applications";
import { Dashboard } from "./components/pages/Dashboard";
import { Settings } from "./components/pages/Settings";
import { API_BASE_URL, authClient } from "./lib/auth/auth";


interface AppUsageSummary {
  app_name: string;
  total_duration: number;
  total_active_time: number;
  total_idle_time: number;
  total_sessions: number;
}

interface HourlyActivity {
  date: string;
  hour: number;
  app_name: string;
  process_path: string;
  active_time: number;
  idle_time: number;
  total_time: number;
  focus_count: number;
  window_titles: string[];
  first_seen: number;
  last_seen: number;
  device_id: string;
  device_name: string;
  os_name: string;
  os_version: string;
}

function App() {
  const [todayUsage, setTodayUsage] = useState<AppUsageSummary[]>([]);
  const [activityLogs, setActivityLogs] = useState<HourlyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showLogin, setShowLogin] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [activePage, setActivePage] = useState("dashboard");
  
  const session = authClient.useSession();
  const { data: activeOrganization } = authClient.useActiveOrganization();

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
      setLastUpdate(new Date());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [usage, logs] = await Promise.all([
        invoke<AppUsageSummary[]>("get_today_usage"),
        invoke<HourlyActivity[]>("get_activity_logs", { limit: 10 }),
      ]);
      setTodayUsage(usage);
      setActivityLogs(logs);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load data:", error);
      setLoading(false);
    }
  }

  async function handleManualScan() {
    setScanning(true);
    try {
      // Force immediate data collection
      await loadData();
      console.log("Manual scan completed at:", new Date().toISOString());
    } catch (error) {
      console.error("Manual scan failed:", error);
    } finally {
      setScanning(false);
    }
  }




  async function handleSync() {
    // Use active organization from Better Auth hook
    const orgId = activeOrganization?.id;
    
    if (!orgId || !session.data) {
      setSyncError("Please login and select an organization");
      return;
    }

    try {
      setSyncing(true);
      setSyncError(null);

      // Get unsynced activities from Rust/Tauri
      const activities = await invoke<HourlyActivity[]>("get_activity_logs", { limit: 100 });

      if (activities.length === 0) {
        console.log("No activities to sync");
        setSyncing(false);
        return;
      }

      // Transform snake_case to camelCase for API
      const transformedActivities = activities.map(activity => ({
        date: activity.date,
        hour: activity.hour,
        appName: activity.app_name && activity.app_name.trim() ? activity.app_name : "Unknown Application",
        processPath: activity.process_path,
        activeTime: activity.active_time,
        idleTime: activity.idle_time,
        totalTime: activity.total_time,
        focusCount: activity.focus_count,
        windowTitles: activity.window_titles,
        firstSeen: activity.first_seen,
        lastSeen: activity.last_seen,
        deviceId: activity.device_id,
        deviceName: activity.device_name,
        osName: activity.os_name,
        osVersion: activity.os_version,
      }));

      // Call server API directly (Better Auth cookies sent automatically)
      const response = await fetch(`${API_BASE_URL}/api/desktop/sync`, {
        method: 'POST',
        credentials: 'include', // Sends Better Auth cookies automatically
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: orgId,
          activities: transformedActivities,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Sync error:", errorData);
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        const syncTime = new Date();
        setLastSync(syncTime);
        console.log(`✓ SYNC COMPLETED at ${syncTime.toLocaleString()}`);
        console.log(`  - Synced: ${result.synced_count} records`);
        console.log(`  - Failed: ${result.failed_count} records`);
        console.log(`  - Sessions: ${result.sessions_synced}`);
        console.log(`  - Activities: ${result.activities_synced}`);
        console.log(`  - Duration: ${result.duration}ms`);
        console.log(`  - Organization: ${activeOrganization?.name}`);
      } else {
        setSyncError(`Sync completed with ${result.failed_count} failures`);
      }
    } catch (error) {
      console.error("Sync failed:", error);
      setSyncError(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  function renderPage() {
    switch (activePage) {
      case "dashboard":
        return <Dashboard todayUsage={todayUsage} activityLogs={activityLogs} />;
      case "applications":
        return <Applications todayUsage={todayUsage} />;
      case "timeline":
        return <ActivityTimeline activityLogs={activityLogs} />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard todayUsage={todayUsage} activityLogs={activityLogs} />;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-300 text-lg">Loading activity data...</p>
        </div>
      </div>
    );
  }

  // Show login modal if not authenticated or no org selected
  if (showLogin || !session.data || !activeOrganization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Login />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex overflow-hidden">
      <Sidebar
        activePage={activePage}
        onPageChange={setActivePage}
        onManualScan={handleManualScan}
        onSync={handleSync}
        onShowLogin={() => setShowLogin(true)}
        scanning={scanning}
        syncing={syncing}
        syncError={syncError}
        lastSync={lastSync}
        lastUpdate={lastUpdate}
        activeOrganization={activeOrganization}
      />
      <div className="flex-1 overflow-y-auto p-6">
        {renderPage()}
      </div>
    </div>
  );
}

export default App;
