"use client";

import { useState } from "react";

interface LoginPageProps {
  onLogin: () => void;
  storeName: string;
}

export default function LoginPage({ onLogin, storeName }: LoginPageProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        onLogin();
      } else {
        setError(data.error || "خطا در ورود");
      }
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-velvet-950/50 via-dark-950 to-dark-900" />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-dark-900/80 backdrop-blur-sm rounded-2xl border border-velvet-900/30 p-8 shadow-2xl">
          {/* Logo area */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-velvet-700 to-velvet-900 flex items-center justify-center shadow-lg pulse-glow">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{storeName}</h1>
            <p className="text-dark-400 text-sm">سیستم مدیریت حضور و غیاب</p>
            <div className="gold-separator mt-4" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-dark-300 text-sm mb-2">
                رمز عبور مدیریت
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:border-velvet-700 focus:ring-1 focus:ring-velvet-700 focus:outline-none transition-colors"
                placeholder="رمز عبور را وارد کنید"
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-l from-velvet-700 to-velvet-800 hover:from-velvet-600 hover:to-velvet-700 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-velvet-700/20"
            >
              {loading ? "در حال ورود..." : "ورود"}
            </button>
          </form>

          <p className="text-center text-dark-500 text-xs mt-6">
            رمز پیش‌فرض: admin
          </p>
        </div>
      </div>
    </div>
  );
}
