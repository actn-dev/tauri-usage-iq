import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { 
  Activity, 
  Clock, 
  Moon, 
  TrendingUp,
  Monitor,
  Settings,
  RefreshCw
} from "lucide-react";
import "./App.css";

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

  function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  }

  const totalActive = todayUsage.reduce((sum, app) => sum + app.total_active_time, 0);
  const totalIdle = todayUsage.reduce((sum, app) => sum + app.total_idle_time, 0);
  const totalTime = totalActive + totalIdle;

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Dilly
            </h1>
            <p className="text-slate-400">Desktop Activity Tracker</p>
            
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <div className="text-slate-400">Last updated</div>
              <div className="text-slate-200 font-mono">{formatTime(lastUpdate)}</div>
            </div>
            <button
              onClick={loadData}
              className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-blue-400" />
            </button>
            <button className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Activity className="w-6 h-6 text-green-400" />
            </div>
            <div className="text-slate-400 text-sm">Active Time</div>
          </div>
          <div className="text-3xl font-bold text-green-400">
            {formatDuration(totalActive)}
          </div>
          <div className="text-slate-500 text-sm mt-2">
            Actively using computer
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Moon className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="text-slate-400 text-sm">Idle Time</div>
          </div>
          <div className="text-3xl font-bold text-yellow-400">
            {formatDuration(totalIdle)}
          </div>
          <div className="text-slate-500 text-sm mt-2">
            Computer idle or away
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-slate-400 text-sm">Total Time</div>
          </div>
          <div className="text-3xl font-bold text-blue-400">
            {formatDuration(totalTime)}
          </div>
          <div className="text-slate-500 text-sm mt-2">
            {todayUsage.length} apps used today
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Applications */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold">Top Applications Today</h2>
          </div>

          {todayUsage.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Monitor className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No activity recorded yet</p>
              <p className="text-sm mt-2">Start using applications to see stats</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayUsage.slice(0, 5).map((app, index) => {
                const percentage = totalTime > 0 ? (app.total_duration / totalTime) * 100 : 0;
                return (
                  <div key={index} className="group hover:bg-slate-700/50 p-3 rounded-lg transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium truncate flex-1">
                        {app.app_name || "(unknown)"}
                      </div>
                      <div className="text-slate-300 font-mono text-sm">
                        {formatDuration(app.total_duration)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-400 w-12 text-right">
                        {percentage.toFixed(0)}%
                      </div>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-slate-500">
                      <span className="text-green-400">
                        ⚡ {formatDuration(app.total_active_time)}
                      </span>
                      <span className="text-yellow-400">
                        ☾ {formatDuration(app.total_idle_time)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold">Recent Activity</h2>
          </div>

          {activityLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No activities recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activityLogs.map((log, index) => (
                <div
                  key={index}
                  className="group hover:bg-slate-700/50 p-3 rounded-lg transition-colors border border-slate-700/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">
                      {log.app_name || "(unknown)"}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      {log.date} {String(log.hour).padStart(2, '0')}:00
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="text-green-400">
                      ⚡ {formatDuration(log.active_time)}
                    </span>
                    <span className="text-yellow-400">
                      ☾ {formatDuration(log.idle_time)}
                    </span>
                    <span className="text-slate-500">
                      • {log.focus_count} focuses
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto mt-8 text-center text-sm text-slate-500">
        <p>Tracking with 1-second precision • Idle detection at 60 seconds</p>
      </div>
    </div>
  );
}

export default App;
