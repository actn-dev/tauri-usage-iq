import { Activity, Clock } from "lucide-react";

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

interface ActivityTimelineProps {
  activityLogs: HourlyActivity[];
}

export function ActivityTimeline({ activityLogs }: ActivityTimelineProps) {
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

  // Group activities by hour
  const groupedActivities = activityLogs.reduce((acc, log) => {
    const key = `${log.date} ${String(log.hour).padStart(2, "0")}:00`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(log);
    return acc;
  }, {} as Record<string, HourlyActivity[]>);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Activity className="w-8 h-8 text-blue-400" />
          Activity Timeline
        </h1>
        <p className="text-slate-400">
          Hourly breakdown of your computer activity
        </p>
      </div>

      {activityLogs.length === 0 ? (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-12 text-center">
          <Clock className="w-20 h-20 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">
            No Activity Yet
          </h3>
          <p className="text-slate-500">
            Activity logs will appear here as you use your computer
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedActivities).map(([timeKey, logs]) => (
            <div
              key={timeKey}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6"
            >
              {/* Time Header */}
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-700">
                <Clock className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-slate-200">
                  {timeKey}
                </h3>
                <span className="text-sm text-slate-400">
                  ({logs.length} {logs.length === 1 ? "activity" : "activities"})
                </span>
              </div>

              {/* Activities List */}
              <div className="space-y-3">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className="group hover:bg-slate-700/50 p-4 rounded-lg transition-colors border border-slate-700/50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-medium text-slate-200 mb-1">
                          {log.app_name || "(unknown)"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {log.process_path || "No path available"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono text-slate-300">
                          {formatDuration(log.total_time)}
                        </div>
                        <div className="text-xs text-slate-500">total</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="bg-green-500/10 border border-green-500/20 rounded p-2">
                        <div className="text-xs text-green-400 mb-1">
                          Active Time
                        </div>
                        <div className="text-sm font-medium text-green-300">
                          {formatDuration(log.active_time)}
                        </div>
                      </div>
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2">
                        <div className="text-xs text-yellow-400 mb-1">
                          Idle Time
                        </div>
                        <div className="text-sm font-medium text-yellow-300">
                          {formatDuration(log.idle_time)}
                        </div>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2">
                        <div className="text-xs text-blue-400 mb-1">
                          Focus Count
                        </div>
                        <div className="text-sm font-medium text-blue-300">
                          {log.focus_count}
                        </div>
                      </div>
                    </div>

                    {log.window_titles && log.window_titles.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs text-slate-400 mb-2">
                          Window Titles:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {log.window_titles.slice(0, 5).map((title, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300"
                            >
                              {title}
                            </span>
                          ))}
                          {log.window_titles.length > 5 && (
                            <span className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-500">
                              +{log.window_titles.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-4 text-xs text-slate-500">
                      <span>Device: {log.device_name || "Unknown"}</span>
                      <span>•</span>
                      <span>
                        {log.os_name} {log.os_version}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
