"use client";

import { Team, getTeamById, REGION_COLORS } from "@/lib/tournament";
import { MatchResult } from "@/hooks/useResults";
import { Trophy, Swords, Radio } from "lucide-react";

interface BracketMatch {
  id: string;
  label: string;
  team1?: Team;
  team2?: Team;
  winner?: string;
}

interface BracketPickerProps {
  quarterfinals: BracketMatch[];
  semifinals: BracketMatch[];
  final: BracketMatch;
  onPickWinner: (matchId: string, teamId: string) => void;
  champion?: string;
  liveResults?: Record<string, MatchResult>;
}

function MatchCard({
  match,
  onPick,
  size = "md",
  liveResult,
}: {
  match: BracketMatch;
  onPick: (teamId: string) => void;
  size?: "sm" | "md" | "lg";
  liveResult?: MatchResult;
}) {
  const team1 = match.team1;
  const team2 = match.team2;

  const isLive = liveResult?.status === "inProgress";
  const isCompleted = liveResult?.status === "completed";
  const isLocked = isLive || isCompleted;

  // Resolve scores respecting API team order vs bracket order
  const apiTeam1MatchesBracket = liveResult?.team1Id === team1?.id;
  const score1 = liveResult ? (apiTeam1MatchesBracket ? liveResult.score1 : liveResult.score2) : undefined;
  const score2 = liveResult ? (apiTeam1MatchesBracket ? liveResult.score2 : liveResult.score1) : undefined;

  const effectiveWinner = liveResult?.winnerId ?? match.winner;

  const TeamSlot = ({ team, isWinner, score }: { team?: Team; isWinner: boolean; score?: number }) => {
    const regionColor = team ? REGION_COLORS[team.region] : undefined;
    const isLoser = effectiveWinner && team && effectiveWinner !== team.id;
    const canClick = !!team && !!match.team1 && !!match.team2 && !isLocked;

    return (
      <button
        onClick={() => canClick && onPick(team!.id)}
        disabled={!canClick}
        className={`
          flex items-center gap-2 w-full p-2 rounded-sm border transition-all text-left
          ${!team ? "border-[#1E2D3D]/30 bg-[#010A13]/50 cursor-default" : ""}
          ${canClick ? "border-[#1E2D3D] bg-[#0A1428] hover:border-[#C8AA6E]/50 hover:bg-[#C8AA6E]/5 cursor-pointer" : ""}
          ${isWinner ? "border-[#C8AA6E] bg-[#C8AA6E]/10 shadow-[0_0_10px_rgba(200,170,110,0.2)]" : ""}
          ${isLoser ? "border-[#1E2D3D]/20 bg-transparent opacity-30" : ""}
          ${isLive && !isWinner ? "border-[#E84057]/30" : ""}
        `}
      >
        {team ? (
          <>
            <div
              className={`${size === "lg" ? "w-8 h-8" : "w-6 h-6"} hex-clip flex items-center justify-center flex-shrink-0`}
              style={{ backgroundColor: `${team.logoColor}22` }}
            >
              <span className="text-[10px] font-black leading-none" style={{ color: team.logoColor }}>
                {team.shortName.slice(0, 3)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-bold truncate ${size === "lg" ? "text-sm" : "text-xs"} ${isWinner ? "text-[#C8AA6E]" : "text-[#F0E6D3]"}`}>
                {size === "lg" ? team.name : team.shortName}
              </div>
              <div className="text-[10px] font-semibold" style={{ color: regionColor }}>{team.region}</div>
            </div>
            {score !== undefined && (
              <span className={`text-sm font-black tabular-nums w-5 text-center flex-shrink-0 ${isWinner ? "text-[#C8AA6E]" : isLive ? "text-[#E84057]" : "text-[#3D5A6F]"}`}>
                {score}
              </span>
            )}
            {isWinner && score === undefined && <div className="w-2 h-2 rounded-full bg-[#C8AA6E] flex-shrink-0" />}
          </>
        ) : (
          <div className={`${size === "lg" ? "text-sm" : "text-xs"} text-[#1E2D3D] italic`}>TBD</div>
        )}
      </button>
    );
  };

  return (
    <div className={`lol-panel rounded-sm p-2 w-full ${isLive ? "border-[#E84057]/40 shadow-[0_0_12px_rgba(232,64,87,0.15)]" : ""}`}>
      <div className="flex items-center gap-1.5 mb-1.5 px-1">
        {isLive && <Radio className="w-3 h-3 text-[#E84057] animate-pulse flex-shrink-0" />}
        <div className="text-[10px] text-[#3D5A6F] tracking-widest font-semibold truncate">{match.label}</div>
        {isLive && <span className="text-[9px] text-[#E84057] font-black tracking-widest ml-auto flex-shrink-0">LIVE</span>}
      </div>
      <div className="space-y-1">
        <TeamSlot team={team1} isWinner={effectiveWinner === team1?.id} score={score1} />
        <div className="flex items-center gap-1 px-1">
          <div className="flex-1 h-px bg-[#1E2D3D]" />
          <Swords className="w-3 h-3 text-[#1E2D3D]" />
          <div className="flex-1 h-px bg-[#1E2D3D]" />
        </div>
        <TeamSlot team={team2} isWinner={effectiveWinner === team2?.id} score={score2} />
      </div>
    </div>
  );
}

export default function BracketPicker({
  quarterfinals,
  semifinals,
  final,
  onPickWinner,
  champion,
  liveResults = {},
}: BracketPickerProps) {
  const championTeam = champion ? getTeamById(champion) : undefined;

  return (
    <div className="space-y-6">
      {/* Semifinals */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-1 h-6 bg-[#A855F7] rounded-full" />
          <h3 className="text-[#A855F7] font-black tracking-widest text-sm uppercase">Semifinals</h3>
          <div className="flex-1 h-px bg-[#1E2D3D]" />
        </div>
        <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
          {semifinals.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onPick={(teamId) => onPickWinner(match.id, teamId)}
              size="md"
              liveResult={liveResults[match.id]}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <div className="flex items-center gap-2">
          <div className="w-16 h-px bg-[#1E2D3D]" />
          <div className="text-xs tracking-widest text-[#3D5A6F]">GRAND FINAL</div>
          <div className="w-16 h-px bg-[#1E2D3D]" />
        </div>
      </div>

      {/* Final */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-1 h-6 bg-[#C8AA6E] rounded-full" />
          <h3 className="text-[#C8AA6E] font-black tracking-widest text-sm uppercase">Grand Final</h3>
          <div className="flex-1 h-px bg-[#1E2D3D]" />
        </div>
        <div className="max-w-xs mx-auto">
          <MatchCard
            match={final}
            onPick={(teamId) => onPickWinner(final.id, teamId)}
            size="lg"
            liveResult={liveResults[final.id]}
          />
        </div>
      </div>

      {/* Champion */}
      {champion && (
        <div className="text-center pt-4">
          <div className="inline-block lol-panel rounded-sm px-8 py-5 relative">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#C8AA6E]" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#C8AA6E]" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#C8AA6E]" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#C8AA6E]" />

            <Trophy className="w-8 h-8 text-[#C8AA6E] mx-auto mb-2 float-anim" />
            <div className="text-[#3D5A6F] text-xs tracking-widest mb-1">YOUR CHAMPION</div>
            <div className="text-[#C8AA6E] font-black text-xl tracking-wider">
              {championTeam?.name || champion}
            </div>
            {championTeam && (
              <div
                className="text-xs font-semibold tracking-widest mt-1"
                style={{ color: REGION_COLORS[championTeam.region] }}
              >
                {championTeam.region}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
