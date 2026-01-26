import { Settings as SettingsIcon, User, Database, Bell, Shield } from "lucide-react";

export function Settings() {
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

        {/* Privacy Settings */}
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
    </div>
  );
}
