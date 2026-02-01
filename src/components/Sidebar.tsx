import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Monitor,
  RefreshCw,
  LogIn,
  Cloud,
  CloudOff,
  LayoutDashboard,
  AppWindow,
  Activity,
  Settings as SettingsIcon,
} from "lucide-react";

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
  onManualScan: () => void;
  onSync: () => void;
  onShowLogin: () => void;
  scanning: boolean;
  syncing: boolean;
  syncError: string | null;
  lastSync: Date | null;
  lastUpdate: Date;
  activeOrganization: any;
}

interface RunningApp {
  app_name: string;
  duration: number;
  is_active: boolean;
}

export function Sidebar({
  activePage,
  onPageChange,
  onManualScan,
  onSync,
  onShowLogin,
  scanning,
  syncing,
  syncError,
  lastSync,
  lastUpdate,
  activeOrganization,
}: SidebarProps) {
  const [runningApps, setRunningApps] = useState<RunningApp[]>([]);

  useEffect(() => {
    // Poll for running apps every 2 seconds
    const loadRunningApps = async () => {
      try {
        // You'll need to implement this Tauri command
        const apps = await invoke<RunningApp[]>("get_running_apps");
        setRunningApps(apps);
      } catch (error) {
        console.error("Failed to load running apps:", error);
        // For now, show empty array if not implemented
        setRunningApps([]);
      }
    };

    loadRunningApps();
    const interval = setInterval(loadRunningApps, 2000);
    return () => clearInterval(interval);
  }, []);

  function formatTime(date: Date): string {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "applications", label: "Applications", icon: AppWindow },
    { id: "timeline", label: "Activity Timeline", icon: Activity },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="w-60 bg-slate-800/50 backdrop-blur-sm border-r border-slate-700 flex flex-col h-full flex-shrink-0">
      {/* Header - Fixed */}
      <div className="p-4 border-b border-slate-700 flex-shrink-0">
        <h1 className="text-xl font-bold mb-1 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Dilly
        </h1>
        <p className="text-slate-400 text-xs">Desktop Activity Tracker</p>
        {activeOrganization && (
          <div className="mt-2 p-1.5 bg-green-500/10 border border-green-500/20 rounded">
            <p className="text-xs text-green-400 truncate">
              ✓ {activeOrganization.name}
            </p>
          </div>
        )}
      </div>

      {/* Control Buttons - Fixed */}
      <div className="p-3 space-y-2 border-b border-slate-700 flex-shrink-0">
        <button
          onClick={onManualScan}
          disabled={scanning}
          className={`w-full p-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors ${
            scanning
              ? "bg-blue-500/20 cursor-wait"
              : "bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30"
          }`}
        >
          <RefreshCw
            className={`w-4 h-4 text-blue-400 ${scanning ? "animate-spin" : ""}`}
          />
          <span className="text-xs font-medium text-blue-300">
            {scanning ? "Scanning..." : "Manual Scan"}
          </span>
        </button>

        <button
          onClick={onSync}
          disabled={syncing || !activeOrganization}
          className={`w-full p-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors ${
            syncing
              ? "bg-purple-500/20 cursor-wait"
              : activeOrganization
              ? "bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30"
              : "bg-slate-700 opacity-50 cursor-not-allowed"
          }`}
        >
          {syncing ? (
            <Cloud className="w-4 h-4 text-purple-400 animate-pulse" />
          ) : syncError ? (
            <CloudOff className="w-4 h-4 text-red-400" />
          ) : (
            <Cloud className="w-4 h-4 text-purple-400" />
          )}
          <span className="text-xs font-medium text-purple-300">
            {syncing ? "Syncing..." : "Sync to Server"}
          </span>
        </button>

        {lastSync && (
          <div className="text-xs text-center text-green-400">
            Synced: {formatTime(lastSync)}
          </div>
        )}
        {syncError && (
          <div className="text-xs text-center text-red-400">{syncError}</div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Navigation */}
        <div className="p-3 border-b border-slate-700">
          <h2 className="text-xs font-semibold text-slate-400 mb-2 px-1">
            NAVIGATION
          </h2>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`w-full p-2.5 rounded-lg flex items-center gap-2 transition-colors ${
                    isActive
                      ? "bg-blue-500/20 border border-blue-500/30 text-blue-300"
                      : "hover:bg-slate-700/50 text-slate-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Running Apps */}
        <div className="p-3">
          <h2 className="text-xs font-semibold text-slate-400 mb-2 px-1 flex items-center gap-2">
            <Monitor className="w-3 h-3" />
            RUNNING NOW ({runningApps.length})
          </h2>
          {runningApps.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <Monitor className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No active apps</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {runningApps.slice(0, 10).map((app, index) => (
                <div
                  key={index}
                  className="p-2 bg-slate-700/30 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        app.is_active ? "bg-green-400" : "bg-slate-500"
                      }`}
                    />
                    <span className="text-xs text-slate-300 truncate">
                      {app.app_name || "(unknown)"}
                    </span>
                  </div>
                  {app.duration > 0 && (
                    <span className="text-xs text-slate-500 ml-2">
                      {formatDuration(app.duration)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer - Fixed */}
      <div className="p-3 border-t border-slate-700 flex-shrink-0">
        <div className="text-xs text-slate-500 mb-2">
          <div>Updated: {formatTime(lastUpdate)}</div>
        </div>
        <button
          onClick={onShowLogin}
          className="w-full p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <LogIn className="w-3 h-3 text-slate-400" />
          <span className="text-xs text-slate-300">Account Settings</span>
        </button>
      </div>
    </div>
  );
}
