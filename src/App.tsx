import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

interface AppUsageSummary {
  app_name: string;
  total_duration: number;
  total_sessions: number;
}

interface ActivityLog {
  app_name: string;
  process_path: string;
  window_title: string;
  start_time: number;
  end_time: number;
  duration: number;
}

function App() {
  const [todayUsage, setTodayUsage] = useState<AppUsageSummary[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [showSessions, setShowSessions] = useState(false);

  useEffect(() => {
    loadData();
    // Refresh every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [usage, logs, debug] = await Promise.all([
        invoke<AppUsageSummary[]>("get_today_usage"),
        invoke<ActivityLog[]>("get_activity_logs", { limit: 20 }),
        invoke<any>("get_debug_info"),
      ]);
      setTodayUsage(usage);
      setActivityLogs(logs);
      setDebugInfo(debug);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load data:", error);
      setLoading(false);
    }
  }

  function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString();
  }

  return (
    <main className="container">
      <h1>Usage IQ - Activity Tracker</h1>
      <p>Real-time application usage tracking</p>

      <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
        <button onClick={() => setShowDebug(!showDebug)}>
          {showDebug ? "Hide" : "Show"} Debug Info
        </button>
        <button onClick={() => setShowSessions(!showSessions)}>
          {showSessions ? "Hide" : "Show"} Individual Sessions
        </button>
        <button onClick={loadData}>Refresh Now</button>
      </div>

      {showDebug && debugInfo && (
        <div style={{ 
          marginTop: "2rem", 
          padding: "1rem", 
          background: "#1a1a1a", 
          borderRadius: "8px",
          textAlign: "left"
        }}>
          <h2>🔍 Debug Information</h2>
          <pre style={{ fontSize: "0.9rem", overflow: "auto" }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      {loading ? (
        <p>Loading usage data...</p>
      ) : (
        <>
          <div style={{ marginTop: "2rem" }}>
            <h2>Today's Usage Summary</h2>
            {todayUsage.length === 0 ? (
              <p>No activity recorded yet. Start using applications to see stats!</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #555" }}>
                    <th style={{ textAlign: "left", padding: "0.5rem" }}>Application</th>
                    <th style={{ textAlign: "right", padding: "0.5rem" }}>Duration</th>
                    <th style={{ textAlign: "right", padding: "0.5rem" }}>Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {todayUsage.map((app, index) => (
                    <tr key={index} style={{ borderBottom: "1px solid #333" }}>
                      <td style={{ padding: "0.5rem" }}>
                        {app.app_name || <em style={{ color: "#888" }}>(empty - see debug)</em>}
                      </td>
                      <td style={{ textAlign: "right", padding: "0.5rem" }}>
                        {formatDuration(app.total_duration)}
                      </td>
                      <td style={{ textAlign: "right", padding: "0.5rem" }}>
                        {app.total_sessions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {showSessions && (
            <div style={{ marginTop: "2rem" }}>
              <h2>📋 Individual Sessions (Recent 20)</h2>
              {activityLogs.length === 0 ? (
                <p>No sessions recorded yet.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #555" }}>
                      <th style={{ textAlign: "left", padding: "0.5rem" }}>Time</th>
                      <th style={{ textAlign: "left", padding: "0.5rem" }}>App</th>
                      <th style={{ textAlign: "left", padding: "0.5rem" }}>Window Title</th>
                      <th style={{ textAlign: "left", padding: "0.5rem" }}>Process Path</th>
                      <th style={{ textAlign: "right", padding: "0.5rem" }}>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityLogs.map((log, index) => (
                      <tr key={index} style={{ borderBottom: "1px solid #333" }}>
                        <td style={{ padding: "0.5rem", whiteSpace: "nowrap" }}>
                          {formatTimestamp(log.start_time)}
                        </td>
                        <td style={{ padding: "0.5rem" }}>
                          {log.app_name || <em style={{ color: "#888" }}>(empty)</em>}
                        </td>
                        <td style={{ padding: "0.5rem", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {log.window_title || <em style={{ color: "#888" }}>(empty)</em>}
                        </td>
                        <td style={{ padding: "0.5rem", fontSize: "0.8rem", color: "#999", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {log.process_path || <em style={{ color: "#888" }}>(empty)</em>}
                        </td>
                        <td style={{ textAlign: "right", padding: "0.5rem" }}>
                          {formatDuration(log.duration)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: "2rem", fontSize: "0.9rem", opacity: 0.7 }}>
        <p>Tracking updates every 3 seconds • Display refreshes every 10 seconds</p>
        {debugInfo && (
          <p>Total logs: {debugInfo.total_logs} | Unique apps: {debugInfo.unique_apps}</p>
        )}
      </div>
    </main>
  );
}

export default App;
