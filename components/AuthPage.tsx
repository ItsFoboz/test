"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Mail, Lock, User, Chrome, Eye, EyeOff, Trophy } from "lucide-react";

export default function AuthPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
      } else {
        if (!displayName.trim()) {
          setError("Summoner name is required");
          setLoading(false);
          return;
        }
        await signUpWithEmail(email, password, displayName);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      if (msg.includes("user-not-found") || msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        setError("Invalid credentials. Check your email and password.");
      } else if (msg.includes("email-already-in-use")) {
        setError("Email already registered. Try logging in.");
      } else if (msg.includes("weak-password")) {
        setError("Password must be at least 6 characters.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#010A13] bg-particles flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#C8AA6E] opacity-[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#0BC4E3] opacity-[0.03] rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C8372D] opacity-[0.02] rounded-full blur-3xl" />
      </div>

      {/* Logo & Title */}
      <div className="relative z-10 text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Trophy className="w-8 h-8 text-[#C8AA6E] float-anim" />
          <h1 className="text-4xl font-black tracking-widest shimmer-text">
            FIRST STAND
          </h1>
          <Trophy className="w-8 h-8 text-[#C8AA6E] float-anim" style={{ animationDelay: "0.5s" }} />
        </div>
        <p className="text-[#C8AA6E] tracking-[0.4em] text-sm font-semibold">
          2026 — TOURNAMENT PICKER
        </p>
        <p className="text-[#3D5A6F] text-xs mt-2 tracking-widest">
          LEAGUE OF LEGENDS
        </p>
      </div>

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-md lol-panel rounded-sm p-8">
        {/* Top decorative corners */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#C8AA6E]" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#C8AA6E]" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#C8AA6E]" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#C8AA6E]" />

        {/* Mode tabs */}
        <div className="flex mb-6 border-b border-[#1E2D3D]">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className={`flex-1 pb-3 text-sm font-semibold tracking-widest uppercase transition-all ${
                mode === m
                  ? "text-[#C8AA6E] border-b-2 border-[#C8AA6E] -mb-px"
                  : "text-[#3D5A6F] hover:text-[#A0B4C5]"
              }`}
            >
              {m === "login" ? "Login" : "Register"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3D5A6F]" />
              <input
                type="text"
                placeholder="Summoner Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="lol-input w-full pl-10 pr-4 py-3 rounded-sm text-sm"
                required
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3D5A6F]" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="lol-input w-full pl-10 pr-4 py-3 rounded-sm text-sm"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3D5A6F]" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="lol-input w-full pl-10 pr-10 py-3 rounded-sm text-sm"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3D5A6F] hover:text-[#C8AA6E] transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <div className="bg-[#C8372D]/10 border border-[#C8372D]/30 text-[#E84057] text-xs p-3 rounded-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full py-3 rounded-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "..." : mode === "login" ? "Enter the Rift" : "Join the Battle"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[#1E2D3D]" />
          <span className="text-[#3D5A6F] text-xs tracking-widest">OR</span>
          <div className="flex-1 h-px bg-[#1E2D3D]" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="btn-outline-gold w-full py-3 rounded-sm text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Chrome className="w-4 h-4" />
          Continue with Google
        </button>

        <p className="text-center text-[#3D5A6F] text-xs mt-5">
          <Shield className="w-3 h-3 inline mr-1" />
          Your picks are saved to your account
        </p>
      </div>

      {/* Footer */}
      <p className="relative z-10 text-[#1E2D3D] text-xs mt-6 tracking-widest">
        NOT AFFILIATED WITH RIOT GAMES
      </p>
    </div>
  );
}
