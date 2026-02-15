import { authClient } from "@/lib/auth/auth";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, UserPlus, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { OTPInput } from "./OTPInput";

interface SignupFormProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

export function SignupForm({ onSuccess, onLoginClick }: SignupFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);

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

  const passwordStrength = formData.password ? getPasswordStrength(formData.password) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      const result = await authClient.signUp.email(
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          callbackURL: "tauri://localhost",
        },
        {
          onSuccess(context) {
            // Don't store token yet - need to verify email first
            console.log("✅ Signup successful, awaiting email verification");
            setShowOTPVerification(true);
          },
          onError(ctx) {
            setError(ctx.error.message || "Signup failed. Please try again.");
          },
        }
      );

      if (result.error) {
        console.error("Signup error:", result.error);
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP() {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const result = await authClient.emailOtp.verifyEmail({
        email: formData.email,
        otp: otp,
      });

      if (result.error) {
        setError(result.error.message || "Invalid verification code");
      } else {
        // Now sign in to get the token
        const signInResult = await authClient.signIn.email({
          email: formData.email,
          password: formData.password,
        });

        if (signInResult.data) {
          // Store bearer token
          const authToken = signInResult.data.token;
          if (authToken) {
            console.log("📝 Storing bearer token after verification");
            localStorage.setItem("bearer_token", authToken);
          }
          setSuccess(true);
          setTimeout(() => {
            onSuccess?.();
          }, 2000);
        }
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("Failed to verify code. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleResendOTP() {
    setResending(true);
    setError("");

    try {
      await authClient.emailOtp.sendVerificationOtp({
        email: formData.email,
        type: "email-verification",
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
          <h3 className="text-xl font-semibold text-slate-200 mb-2">Email Verified!</h3>
          <p className="text-sm text-slate-400 mb-4">
            Your account has been successfully created and verified.
          </p>
          <p className="text-xs text-slate-500">
            Redirecting you to the dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (showOTPVerification) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-200 mb-2">Verify Your Email</h3>
          <p className="text-sm text-slate-400 mb-4">
            We've sent a 6-digit code to <span className="text-blue-400 font-medium">{formData.email}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <OTPInput
            value={otp}
            onChange={setOtp}
            disabled={verifying}
            error={!!error}
          />

          <button
            onClick={handleVerifyOTP}
            disabled={verifying || otp.length !== 6}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:shadow-none"
          >
            {verifying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Verify Email
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
          <p className="text-xs text-slate-500">
            Didn't receive the code? Check your spam folder or click resend.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 md:p-3">
          <p className="text-xs md:text-sm text-red-300">{error}</p>
        </div>
      )}

      <div className="space-y-1 md:space-y-2">
        <label htmlFor="name" className="block text-xs md:text-sm font-medium text-slate-300">
          Full Name
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            required
            className="w-full pl-10 pr-4 py-2 md:py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-sm md:text-base text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="space-y-1 md:space-y-2">
        <label htmlFor="email" className="block text-xs md:text-sm font-medium text-slate-300">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
        {passwordStrength && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded ${i < passwordStrength.strength
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

      <div className="space-y-1 md:space-y-2">
        <label htmlFor="confirmPassword" className="block text-xs md:text-sm font-medium text-slate-300">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="••••••••"
            required
            minLength={8}
            className="w-full pl-10 pr-12 py-2 md:py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-sm md:text-base text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <p className="text-xs text-red-400">Passwords do not match</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 md:py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-slate-700 disabled:to-slate-700 text-white text-sm md:text-base rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:shadow-none"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Creating account...
          </>
        ) : (
          <>
            <UserPlus className="w-5 h-5" />
            Create Account
          </>
        )}
      </button>

      {onLoginClick && (
        <div className="text-center pt-1 md:pt-2">
          <p className="text-xs md:text-sm text-slate-400">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onLoginClick}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Sign In
            </button>
          </p>
        </div>
      )}
    </form>
  );
}
