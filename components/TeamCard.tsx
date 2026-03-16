"use client";

import { Team, REGION_COLORS } from "@/lib/tournament";

interface TeamCardProps {
  team: Team;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  onClick?: () => void;
  rank?: number;
  showRegion?: boolean;
  dimmed?: boolean;
}

export default function TeamCard({
  team,
  size = "md",
  selected = false,
  onClick,
  rank,
  showRegion = true,
  dimmed = false,
}: TeamCardProps) {
  const regionColor = REGION_COLORS[team.region];

  const sizeClasses = {
    sm: "p-2 gap-2",
    md: "p-3 gap-3",
    lg: "p-4 gap-3",
  };

  const logoSizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  const nameSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center ${sizeClasses[size]} rounded-sm border transition-all
        ${onClick ? "cursor-pointer hover:border-[#C8AA6E]/50 hover:bg-[#C8AA6E]/5" : ""}
        ${selected ? "team-card-selected border-[#C8AA6E]" : "border-[#1E2D3D] bg-[#0A1428]/50"}
        ${dimmed ? "opacity-40" : ""}
      `}
    >
      {rank !== undefined && (
        <span className={`text-xs font-bold w-5 text-center ${rank <= 2 ? "text-[#C8AA6E]" : "text-[#3D5A6F]"}`}>
          {rank}
        </span>
      )}

      {/* Team logo/abbreviation */}
      <div
        className={`${logoSizes[size]} hex-clip flex items-center justify-center font-black flex-shrink-0`}
        style={{ backgroundColor: `${team.logoColor}22`, border: `1px solid ${team.logoColor}44` }}
      >
        <span style={{ color: team.logoColor }} className="font-black leading-none">
          {team.shortName.slice(0, 2)}
        </span>
      </div>

      {/* Team info */}
      <div className="flex-1 min-w-0">
        <div className={`font-bold text-[#F0E6D3] ${nameSizes[size]} leading-tight truncate`}>
          {team.name}
        </div>
        {showRegion && (
          <div className="text-xs" style={{ color: regionColor }}>
            {team.region}
          </div>
        )}
      </div>

      {selected && (
        <div className="w-2 h-2 rounded-full bg-[#C8AA6E] flex-shrink-0" />
      )}
    </div>
  );
}
