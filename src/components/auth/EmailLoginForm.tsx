import { authClient } from "@/lib/auth/auth";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, LogIn, Loader2 } from "lucide-react";

interface EmailLoginFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}

export function EmailLoginForm({ onSuccess, onForgotPassword }: EmailLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authClient.signIn.email(
        {
          email,
          password,
          rememberMe,
        },
        {
          onSuccess(context) {
            const authToken = context.response.headers.get("set-auth-token");
            if (authToken) {
              console.log("📝 Storing bearer token");
              localStorage.setItem("bearer_token", authToken);
            }
            onSuccess?.();
          },
          onError(ctx) {
            if (ctx.error.status === 403) {
              setError("Please verify your email address before logging in. Check your inbox.");
            } else {
              setError(ctx.error.message || "Login failed. Please check your credentials.");
            }
          },
        }
      );

      if (result.error) {
        console.error("Login error:", result.error);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 md:p-3">
          <p className="text-xs md:text-sm text-red-300">{error}</p>
        </div>
      )}

      <div className="space-y-1 md:space-y-2">
        <label htmlFor="email" className="block text-xs md:text-sm font-medium text-slate-300">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full pl-10 pr-4 py-2 md:py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-sm md:text-base text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="space-y-1 md:space-y-2">
        <label htmlFor="password" className="block text-xs md:text-sm font-medium text-slate-300">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={8}
            className="w-full pl-10 pr-12 py-2 md:py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-sm md:text-base text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-900/50 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
          />
          <span className="text-sm text-slate-400">Remember me</span>
        </label>

        {onForgotPassword && (
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Forgot password?
          </button>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:shadow-none"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <LogIn className="w-5 h-5" />
            Sign In
          </>
        )}
      </button>
    </form>
  );
}
