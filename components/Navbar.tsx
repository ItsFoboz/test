"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Trophy, LogOut, User, BarChart2 } from "lucide-react";

interface NavbarProps {
  currentView: "picker" | "leaderboard";
  onViewChange: (view: "picker" | "leaderboard") => void;
}

export default function Navbar({ currentView, onViewChange }: NavbarProps) {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-[#010A13]/95 backdrop-blur-sm border-b border-[#1E2D3D]">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#C8AA6E]" />
          <div>
            <span className="text-[#C8AA6E] font-black tracking-widest text-sm">FIRST STAND</span>
            <span className="text-[#3D5A6F] text-xs ml-2 tracking-widest">2026</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onViewChange("picker")}
            className={`px-4 py-1.5 text-xs font-semibold tracking-widest uppercase rounded-sm transition-all ${
              currentView === "picker"
                ? "text-[#C8AA6E] bg-[#C8AA6E]/10 border border-[#C8AA6E]/30"
                : "text-[#3D5A6F] hover:text-[#A0B4C5]"
            }`}
          >
            My Picks
          </button>
          <button
            onClick={() => onViewChange("leaderboard")}
            className={`px-4 py-1.5 text-xs font-semibold tracking-widest uppercase rounded-sm transition-all flex items-center gap-1.5 ${
              currentView === "leaderboard"
                ? "text-[#C8AA6E] bg-[#C8AA6E]/10 border border-[#C8AA6E]/30"
                : "text-[#3D5A6F] hover:text-[#A0B4C5]"
            }`}
          >
            <BarChart2 className="w-3 h-3" />
            Leaderboard
          </button>
        </div>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            {user?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt="avatar" className="w-7 h-7 rounded-full border border-[#C8AA6E]/30" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#1E2D3D] border border-[#C8AA6E]/30 flex items-center justify-center">
                <User className="w-4 h-4 text-[#C8AA6E]" />
              </div>
            )}
            <span className="text-[#A0B4C5] font-medium hidden sm:block">
              {user?.displayName || user?.email?.split("@")[0]}
            </span>
          </div>
          <button
            onClick={logout}
            className="text-[#3D5A6F] hover:text-[#E84057] transition-colors p-1.5"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
