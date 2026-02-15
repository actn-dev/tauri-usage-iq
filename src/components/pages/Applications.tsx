import { AppWindow } from "lucide-react";

interface AppUsageSummary {
  app_name: string;
  total_duration: number;
  total_active_time: number;
  total_idle_time: number;
  total_sessions: number;
}

interface ApplicationsProps {
  todayUsage: AppUsageSummary[];
}

export function Applications({ todayUsage }: ApplicationsProps) {
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

  const totalTime = todayUsage.reduce(
    (sum, app) => sum + app.total_duration,
    0
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-3xl font-bold mb-2 flex items-center gap-2 md:gap-3">
            <AppWindow className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
            All Applications
          </h1>
          <p className="text-sm md:text-base text-slate-400">
            Complete list of all tracked applications today
          </p>
        </div>
        <div className="text-right">
          <div className="text-xl md:text-2xl font-bold text-blue-400">
            {todayUsage.length}
          </div>
          <div className="text-xs md:text-sm text-slate-400">Apps Tracked</div>
        </div>
      </div>

      {todayUsage.length === 0 ? (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-12 text-center">
          <AppWindow className="w-20 h-20 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">
            No Applications Yet
          </h3>
          <p className="text-slate-500">
            Start using applications to see them tracked here
          </p>
        </div>
      ) : (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50 border-b border-slate-600">
                <tr>
                  <th className="px-2 py-2 md:px-4 md:py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                    #
                  </th>
                  <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                    Application
                  </th>
                  <th className="px-3 py-2 md:px-6 md:py-3 text-right text-xs font-semibold text-slate-400 uppercase">
                    Total Time
                  </th>
                  <th className="px-3 py-2 md:px-6 md:py-3 text-right text-xs font-semibold text-slate-400 uppercase">
                    Active
                  </th>
                  <th className="px-3 py-2 md:px-6 md:py-3 text-right text-xs font-semibold text-slate-400 uppercase">
                    Idle
                  </th>
                  <th className="px-3 py-2 md:px-6 md:py-3 text-right text-xs font-semibold text-slate-400 uppercase">
                    Sessions
                  </th>
                  <th className="px-3 py-2 md:px-6 md:py-3 text-right text-xs font-semibold text-slate-400 uppercase">
                    % of Day
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {todayUsage.map((app, index) => {
                  const percentage =
                    totalTime > 0 ? (app.total_duration / totalTime) * 100 : 0;
                  return (
                    <tr
                      key={index}
                      className="hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-2 py-2 md:px-4 md:py-3 text-xs md:text-sm text-slate-500">
                        {index + 1}
                      </td>
                      <td className="px-3 py-2 md:px-6 md:py-3">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="w-6 h-6 md:w-8 md:h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                            <AppWindow className="w-3 h-3 md:w-4 md:h-4 text-blue-400" />
                          </div>
                          <div className="font-medium text-sm md:text-base text-slate-200">
                            {app.app_name || "(unknown)"}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 md:px-6 md:py-3 text-right font-mono text-xs md:text-sm text-slate-300">
                        {formatDuration(app.total_duration)}
                      </td>
                      <td className="px-3 py-2 md:px-6 md:py-3 text-right text-xs md:text-sm text-green-400">
                        {formatDuration(app.total_active_time)}
                      </td>
                      <td className="px-3 py-2 md:px-6 md:py-3 text-right text-xs md:text-sm text-yellow-400">
                        {formatDuration(app.total_idle_time)}
                      </td>
                      <td className="px-3 py-2 md:px-6 md:py-3 text-right text-xs md:text-sm text-slate-400">
                        {app.total_sessions}
                      </td>
                      <td className="px-3 py-2 md:px-6 md:py-3 text-right">
                        <div className="flex items-center justify-end gap-2 md:gap-3">
                          <div className="w-16 md:w-24 bg-slate-700 rounded-full h-1.5 md:h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs md:text-sm text-slate-400 w-10 md:w-12">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
