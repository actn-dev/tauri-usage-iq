import { authClient } from "@/lib/auth/auth";
import { useState } from "react";
import { Mail, Send, Loader2, CheckCircle2, ArrowLeft, Lock, RefreshCw } from "lucide-react";
import { OTPInput } from "./OTPInput";

interface ForgotPasswordProps {
  onBackToLogin?: () => void;
}

export function ForgotPassword({ onBackToLogin }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOTPStep, setShowOTPStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        type: "forget-password",
        email,
      });

      if (result.error) {
        setError(result.error.message || "Failed to send reset code. Please try again.");
      } else {
        setShowOTPStep(true);
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const result = await authClient.emailOtp.resetPassword({
        email,
        otp,
        password: newPassword,
      });

      if (result.error) {
        setError(result.error.message || "Invalid code or password reset failed");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error("Password reset error:", err);
      setError("Failed to reset password. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleResendOTP() {
    setResending(true);
    setError("");

    try {
      await authClient.emailOtp.sendVerificationOtp({
        type: "forget-password",
        email,
      });
      setOtp("");
    } catch (err) {
      console.error("Resend OTP error:", err);
      setError("Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
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
          <h3 className="text-xl font-semibold text-slate-200 mb-2">Password Reset!</h3>
          <p className="text-sm text-slate-400 mb-4">
            Your password has been successfully reset.
          </p>
          <p className="text-xs text-slate-500 mb-6">
            You can now log in with your new password.
          </p>
        </div>
        {onBackToLogin && (
          <button
            onClick={onBackToLogin}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        )}
      </div>
    );
  }

  if (showOTPStep) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-200 mb-2">Reset Your Password</h3>
          <p className="text-sm text-slate-400 mb-4">
            Enter the 6-digit code sent to <span className="text-blue-400 font-medium">{email}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Verification Code
            </label>
            <OTPInput
              value={otp}
              onChange={setOtp}
              disabled={verifying}
              error={!!error}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="newPassword" className="block text-sm font-medium text-slate-300">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleResetPassword}
            disabled={verifying || otp.length !== 6 || !newPassword || !confirmPassword}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:shadow-none"
          >
            {verifying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Reset Password
              </>
            )}
          </button>

          <button
            onClick={handleResendOTP}
            disabled={resending}
            className="w-full px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            {resending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Resend Code
              </>
            )}
          </button>
        </div>

        <div className="text-center pt-4 border-t border-slate-700">
          <button
            onClick={() => setShowOTPStep(false)}
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Email Entry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-slate-200 mb-2">Forgot Password?</h3>
        <p className="text-sm text-slate-400">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-slate-300">
            Email Address
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
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:shadow-none"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Send Reset Link
            </>
          )}
        </button>

        {onBackToLogin && (
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        )}
      </form>
    </div>
  );
}
