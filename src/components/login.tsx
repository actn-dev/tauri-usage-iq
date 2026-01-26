import { authClient, API_BASE_URL } from "@/lib/auth/auth";
import { OrganizationSelector } from "./OrganizationSelector";
import { useState, useEffect } from "react";
import { LogIn, LogOut, Building2, Loader2 } from "lucide-react";

export function Login() {
    const session = authClient.useSession();
    const { data: activeOrganization } = authClient.useActiveOrganization();
    const [showOrgSelector, setShowOrgSelector] = useState(false);

    // Check if user needs to select organization
    useEffect(() => {
        if (session.data && !activeOrganization) {
            // User is logged in but no active org, show selector
            setShowOrgSelector(true);
        } else if (activeOrganization) {
            // Has active org, hide selector
            setShowOrgSelector(false);
        }
    }, [session.data, activeOrganization]);

    async function handleLogin() {
        await authClient.signIn.social({
            provider: "google",
        });
    }

    async function handleLogout() {
        await authClient.signOut();
        setShowOrgSelector(false);
    }

    function handleOrganizationSelected() {
        // Better Auth will update the hook automatically
        setShowOrgSelector(false);
    }

    function handleChangeOrganization() {
        setShowOrgSelector(true);
    }
   
    if (session.isPending) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-12 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-400 mb-4" />
                <p className="text-slate-300">Loading...</p>
            </div>
        );
    }

    if (session.error) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-red-500/50 rounded-xl p-6 max-w-2xl">
                <h3 className="text-red-400 font-bold mb-3 text-lg">Error: Load failed</h3>
                <div className="space-y-3 text-sm">
                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-slate-400 mb-1">API URL:</p>
                        <p className="text-blue-400 font-mono break-all">{API_BASE_URL}</p>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-slate-400 mb-1">Error Message:</p>
                        <p className="text-red-300 break-words">{session.error.message}</p>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-slate-400 mb-1">Full Error:</p>
                        <pre className="text-xs text-slate-300 overflow-auto max-h-40 whitespace-pre-wrap break-words">
                            {JSON.stringify(session.error, null, 2)}
                        </pre>
                    </div>
                    <div className="text-yellow-400 text-xs mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                        <p className="font-semibold mb-1">Troubleshooting:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Make sure your backend server is running at {API_BASE_URL}</li>
                            <li>Check CORS is configured for tauri://localhost origin</li>
                            <li>Press F12 or Ctrl+Shift+I to open DevTools and check Network tab</li>
                        </ul>
                    </div>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="w-full mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-lg text-sm font-medium transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (session.data) {
        if (showOrgSelector) {
            return (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl">
                    <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                        <p className="text-sm text-slate-300">
                            {session.data.user.email}
                        </p>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-slate-400 hover:text-slate-200 underline flex items-center gap-1"
                        >
                            <LogOut className="w-3 h-3" />
                            Logout
                        </button>
                    </div>
                    <OrganizationSelector onOrganizationSelected={handleOrganizationSelected} />
                </div>
            );
        }

        return (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <div className="mb-6">
                    <p className="text-sm font-medium text-slate-200">{session.data.user.email}</p>
                    {activeOrganization && (
                        <div className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-green-400" />
                            <p className="text-xs text-green-400">
                                {activeOrganization.name}
                            </p>
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                    <button
                        onClick={handleChangeOrganization}
                        className="w-full px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Building2 className="w-4 h-4" />
                        Change Organization
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Sign in to Usage IQ
                </h2>
                <p className="text-sm text-slate-400">
                    Sign in to sync your activity data to your organization.
                </p>
            </div>
            <button
                onClick={handleLogin}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
                <LogIn className="w-5 h-5" />
                Login with Google
            </button>
        </div>
    );
}