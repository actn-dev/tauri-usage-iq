import { Settings as SettingsIcon, User, Database, Bell, Shield, Power } from "lucide-react";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

export function Settings() {
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clearingData, setClearingData] = useState(false);
  const [clearSuccess, setClearSuccess] = useState<string | null>(null);

  useEffect(() => {
    checkAutoStartStatus();
  }, []);

  const checkAutoStartStatus = async () => {
    try {
      const enabled = await invoke<boolean>("is_autostart_enabled");
      setAutoStartEnabled(enabled);
      setLoading(false);
    } catch (err) {
      console.error("Failed to check autostart status:", err);
      setError("Failed to check autostart status");
      setLoading(false);
    }
  };

  const toggleAutoStart = async () => {
    try {
      setError(null);
      if (autoStartEnabled) {
        await invoke("disable_autostart");
        setAutoStartEnabled(false);
      } else {
        await invoke("enable_autostart");
        setAutoStartEnabled(true);
      }
    } catch (err) {
      console.error("Failed to toggle autostart:", err);
      setError(`Failed to ${autoStartEnabled ? 'disable' : 'enable'} autostart`);
    }
  };

  const handleClearData = async () => {
    if (!confirm("Are you sure you want to clear all local activity data? The app will close automatically. This cannot be undone.")) {
      return;
    }

    setClearingData(true);
    setClearSuccess(null);
    setError(null);

    try {
      const result = await invoke<string>("clear_local_data");
      setClearSuccess(`${result} - App will close in a moment...`);
      // App will automatically exit in 1.5 seconds from the backend
    } catch (err) {
      console.error("Failed to clear data:", err);
      setError("Failed to clear local data");
      setClearingData(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-blue-400" />
          Settings
        </h1>
        <p className="text-slate-400">
          Configure your activity tracking preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* System Settings - Background & Auto-start */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Power className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-semibold">System</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-200">
                  Run in Background
                </div>
                <div className="text-xs text-slate-500">
                  App continues tracking when window is closed
                </div>
              </div>
              <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs">
                Always Active
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-200">
                  Start on Login
                </div>
                <div className="text-xs text-slate-500">
                  Automatically start tracking when you log in
                </div>
              </div>
              <button
                onClick={toggleAutoStart}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoStartEnabled ? "bg-blue-600" : "bg-slate-600"
                  } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoStartEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                />
              </button>
            </div>
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            <div className="p-3 bg-slate-700/30 rounded-lg text-xs text-slate-500">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-blue-400">ⓘ</span>
                <span>Close the window to minimize to system tray</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-400">ⓘ</span>
                <span>Right-click the tray icon for quick access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold">Account</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 block mb-2">
                Organization
              </label>
              <div className="p-3 bg-slate-700/50 rounded-lg text-slate-300">
                Connected to organization via Better Auth
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-2">
                Session Status
              </label>
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
                ✓ Authenticated
              </div>
            </div>
          </div>
        </div>

        {/* Tracking Settings */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold">Tracking</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-200">
                  Tracking Interval
                </div>
                <div className="text-xs text-slate-500">
                  Currently: 1 second precision
                </div>
              </div>
              <div className="text-sm text-slate-400">1s</div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-200">
                  Idle Timeout
                </div>
                <div className="text-xs text-slate-500">
                  Time before marking as idle
                </div>
              </div>
              <div className="text-sm text-slate-400">60s</div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-200">
                  Auto Refresh
                </div>
                <div className="text-xs text-slate-500">
                  Dashboard refresh interval
                </div>
              </div>
              <div className="text-sm text-slate-400">10s</div>
            </div>
          </div>
        </div>

        {/* Sync Settings */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-semibold">Sync & Notifications</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-200">
                  Auto Sync
                </div>
                <div className="text-xs text-slate-500">
                  Automatically sync data to server
                </div>
              </div>
              <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm">
                Configure
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-200">
                  Sync Notifications
                </div>
                <div className="text-xs text-slate-500">
                  Get notified when sync completes
                </div>
              </div>
              <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm">
                Enable
              </button>
            </div>
          </div>
        </div>
        {clearSuccess && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
            ✓ {clearSuccess}
          </div>
        )}
        <button
          onClick={handleClearData}
          disabled={clearingData}
          className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-colors text-sm text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {clearingData ? "Clearing..." : "Clear Local Data"}
        </button>
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-400">
          ⚠️ Use this to reset if you see incorrect time counts. The app will close automatically - just restart it to begin fresh tracking.
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-green-400" />
            <h2 className="text-xl font-semibold">Privacy</h2>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-slate-400 mb-3">
                Your data is stored locally and synced securely to your organization's server.
              </div>
              <div className="p-3 bg-slate-700/30 rounded-lg text-xs text-slate-500">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-400">✓</span>
                  <span>End-to-end encrypted sync</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-400">✓</span>
                  <span>Local-first storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Organization-scoped data</span>
                </div>
              </div>
            </div>
            <button className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-colors text-sm text-red-400">
              Clear Local Data
            </button>
          </div>
        </div>
      </div>
    </div >
  );
}
