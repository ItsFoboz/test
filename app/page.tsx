"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthPage from "@/components/AuthPage";
import Navbar from "@/components/Navbar";
import TournamentPicker from "@/components/TournamentPicker";
import Leaderboard from "@/components/Leaderboard";

export default function Home() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<"picker" | "leaderboard">("picker");

  if (loading) {
    return (
      <div className="min-h-screen bg-[#010A13] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#C8AA6E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-[#3D5A6F] text-sm tracking-widest animate-pulse">LOADING...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-[#010A13] bg-particles">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#C8AA6E] opacity-[0.02] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#0BC4E3] opacity-[0.02] rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative z-10">
        <Navbar currentView={view} onViewChange={setView} />

        {/* Hero banner */}
        <div className="border-b border-[#1E2D3D] bg-gradient-to-r from-[#010A13] via-[#0A1428] to-[#010A13]">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-[#3D5A6F] text-xs tracking-[0.4em] font-semibold uppercase mb-0.5">
                League of Legends • International Tournament
              </div>
              <div className="text-[#F0E6D3] font-black text-xl tracking-wider">
                First Stand <span className="shimmer-text">2026</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-6 text-xs text-[#3D5A6F]">
              <div className="text-center">
                <div className="text-[#C8AA6E] font-black text-lg">8</div>
                <div className="tracking-wider">TEAMS</div>
              </div>
              <div className="w-px h-8 bg-[#1E2D3D]" />
              <div className="text-center">
                <div className="text-[#C8AA6E] font-black text-lg">2</div>
                <div className="tracking-wider">GROUPS</div>
              </div>
              <div className="w-px h-8 bg-[#1E2D3D]" />
              <div className="text-center">
                <div className="text-[#C8AA6E] font-black text-lg">6</div>
                <div className="tracking-wider">REGIONS</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="pb-12">
          {view === "picker" ? <TournamentPicker /> : <Leaderboard />}
        </main>
      </div>
    </div>
  );
}
