import { authClient } from "@/lib/auth/auth";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, Key, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface ResetPasswordProps {
  token?: string;
  onSuccess?: () => void;
}

export function ResetPassword({ token: propToken, onSuccess }: ResetPasswordProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState(propToken || "");

  useEffect(() => {
    // Extract token from URL if not provided as prop
    if (!propToken) {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get("token");
      if (urlToken) {
        setToken(urlToken);
      } else {
        setError("No reset token found. Please request a new password reset link.");
      }
    }
  }, [propToken]);

  function getPasswordStrength(password: string): { strength: number; label: string; color: string } {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: "Weak", color: "text-red-400" };
    if (strength <= 3) return { strength, label: "Medium", color: "text-yellow-400" };
    return { strength, label: "Strong", color: "text-green-400" };
  }

  const passwordStrength = password ? getPasswordStrength(password) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (!token) {
      setError("No reset token found. Please request a new password reset link.");
      return;
    }

    setLoading(true);

    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (result.error) {
        if (result.error.message?.includes("Invalid") || result.error.message?.includes("expired")) {
          setError("This reset link is invalid or has expired. Please request a new one.");
        } else {
          setError(result.error.message || "Failed to reset password. Please try again.");
        }
      } else {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token && !propToken) {
    return (
      <div className="space-y-6 text-center py-8">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-500/20 p-4">
            <XCircle className="w-12 h-12 text-red-400" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-slate-200 mb-2">Invalid Reset Link</h3>
          <p className="text-sm text-slate-400 mb-4">
            This password reset link is invalid or has expired.
          </p>
          <p className="text-xs text-slate-500">
            Please request a new password reset link from the login page.
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-6 text-center py-8">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-500/20 p-4">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-slate-200 mb-2">Password Reset Successful!</h3>
          <p className="text-sm text-slate-400 mb-4">
            Your password has been successfully changed.
          </p>
          <p className="text-xs text-slate-500">
            You can now log in with your new password.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-blue-500/20 p-3">
            <Key className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-slate-200 mb-2">Reset Your Password</h3>
        <p className="text-sm text-slate-400">
          Enter your new password below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-slate-300">
            New Password
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
              className="w-full pl-10 pr-12 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {passwordStrength && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded ${
                      i < passwordStrength.strength
                        ? passwordStrength.strength <= 2
                          ? "bg-red-400"
                          : passwordStrength.strength <= 3
                          ? "bg-yellow-400"
                          : "bg-green-400"
                        : "bg-slate-700"
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs ${passwordStrength.color}`}>
                Strength: {passwordStrength.label}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full pl-10 pr-12 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-red-400">Passwords do not match</p>
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
              Resetting...
            </>
          ) : (
            <>
              <Key className="w-5 h-5" />
              Reset Password
            </>
          )}
        </button>
      </form>
    </div>
  );
}
