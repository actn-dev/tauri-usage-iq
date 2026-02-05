import { ResetPassword } from "../auth/ResetPassword";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function ResetPasswordPage() {
  const [token, setToken] = useState("");

  useEffect(() => {
    // Extract token from URL
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      setToken(urlToken);
    }
  }, []);

  const handleSuccess = () => {
    // Redirect to home/login after successful password reset
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
          <ResetPassword token={token} onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
}
