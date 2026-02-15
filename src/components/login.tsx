import { authClient, API_BASE_URL } from "@/lib/auth/auth";
import { OrganizationSelector } from "./OrganizationSelector";
import { EmailLoginForm } from "./auth/EmailLoginForm";
import { SignupForm } from "./auth/SignupForm";
import { ForgotPassword } from "./auth/ForgotPassword";
import { useState, useEffect } from "react";
import { LogIn, LogOut, Building2, Loader2 } from "lucide-react";
import { platform } from "@tauri-apps/plugin-os";

type AuthView = "login" | "signup" | "forgot-password";
type LoginMethod = "google" | "email";

export function Login() {
    const session = authClient.useSession();
    const { data: activeOrganization } = authClient.useActiveOrganization();
    const [showOrgSelector, setShowOrgSelector] = useState(false);
    const [authView, setAuthView] = useState<AuthView>("login");
    const [isWindows, setIsWindows] = useState(false);
    const [loginMethod, setLoginMethod] = useState<LoginMethod>("google");

    // Detect OS platform
    useEffect(() => {
        async function detectOS() {
            const platformName = platform();
            const isWindowsOS = platformName === "windows";
            setIsWindows(isWindows);

            // If Windows, default to email login
            if (isWindowsOS) {
                setLoginMethod("email");
            }
        }
        detectOS();
    }, []);

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
            callbackURL: "tauri://localhost",
        }, {
            onSuccess(context) {
                const authToken = context.response.headers.get("set-auth-token");
                if (authToken) {
                    console.log("📝 Storing bearer token");
                    localStorage.setItem("bearer_token", authToken);
                }
            },
            onError(error) {
                console.error("Login error:", error);
            },
            onResponse(context) {
                console.log("Login response:", context.response);
            },
        });
    }

    async function handleLogout() {
        await authClient.signOut();
        // Clear bearer token on logout
        localStorage.removeItem("bearer_token");
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
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4 md:p-8">
            <div className="text-center mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {authView === "login" ? "Sign in to Dodily" : authView === "signup" ? "Create Account" : "Reset Password"}
                </h2>
                <p className="text-xs md:text-sm text-slate-400">
                    {authView === "login"
                        ? "Sign in to sync your activity data to your organization."
                        : authView === "signup"
                            ? "Create an account to start tracking your productivity."
                            : "Reset your password to regain access to your account."}
                </p>
            </div>

            {authView === "forgot-password" ? (
                <ForgotPassword onBackToLogin={() => setAuthView("login")} />
            ) : authView === "signup" ? (
                <SignupForm
                    onSuccess={() => setAuthView("login")}
                    onLoginClick={() => setAuthView("login")}
                />
            ) : (
                <>
                    {/* Login Method Tabs */}
                    <div className="flex gap-2 mb-6">
                        {!isWindows && (
                            <button
                                onClick={() => setLoginMethod("google")}
                                className={`flex-1 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm md:text-base font-medium transition-all ${loginMethod === "google"
                                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                    : "bg-slate-700/50 text-slate-400 border border-slate-700 hover:bg-slate-700"
                                    }`}
                            >
                                Google
                            </button>
                        )}
                        <button
                            onClick={() => setLoginMethod("email")}
                            className={`flex-1 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm md:text-base font-medium transition-all ${loginMethod === "email"
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                : "bg-slate-700/50 text-slate-400 border border-slate-700 hover:bg-slate-700"
                                }`}
                        >
                            Email
                        </button>
                    </div>

                    {loginMethod === "email" ? (
                        <EmailLoginForm
                            onForgotPassword={() => setAuthView("forgot-password")}
                        />
                    ) : !isWindows ? (
                        <button
                            onClick={handleLogin}
                            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                            <LogIn className="w-5 h-5" />
                            Login with Google
                        </button>
                    ) : null}

                    {/* Sign up link */}
                    <div className="text-center mt-4 pt-4 md:mt-6 md:pt-6 border-t border-slate-700">
                        <p className="text-xs md:text-sm text-slate-400">
                            Don't have an account?{" "}
                            <button
                                onClick={() => setAuthView("signup")}
                                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                            >
                                Sign Up
                            </button>
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}