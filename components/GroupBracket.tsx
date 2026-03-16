"use client";

import { Group, GroupBracketPicks, REGION_COLORS, getTeamById } from "@/lib/tournament";
import { MatchResult } from "@/hooks/useResults";
import { getSchedule, formatMatchTime, matchStatus } from "@/lib/schedule";
import { Swords, Trophy, Lock, Radio } from "lucide-react";

interface GroupBracketProps {
  group: Group;
  picks: GroupBracketPicks;
  onChange: (groupId: string, picks: GroupBracketPicks) => void;
  liveResults?: Record<string, MatchResult>; // bracketMatchId → result
}

interface MatchSlotProps {
  teamId?: string;
  isWinner?: boolean;
  isLoser?: boolean;
  isEliminated?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  label?: string;
}

function TeamSlot({ teamId, isWinner, isLoser, isEliminated, onClick, disabled, label }: MatchSlotProps) {
  const team = teamId ? getTeamById(teamId) : undefined;
  const regionColor = team ? REGION_COLORS[team.region] : undefined;

  return (
    <button
      onClick={onClick}
      disabled={disabled || !teamId || !onClick}
      className={`
        flex items-center gap-2 w-full px-2 py-1.5 rounded-sm border text-left transition-all
        ${!teamId ? "border-[#1E2D3D]/30 bg-transparent cursor-default" : ""}
        ${teamId && !isWinner && !isLoser && onClick && !disabled
          ? "border-[#1E2D3D] bg-[#0A1428] hover:border-[#C8AA6E]/60 hover:bg-[#C8AA6E]/5 cursor-pointer"
          : ""}
        ${isWinner ? "border-[#C8AA6E] bg-[#C8AA6E]/10 shadow-[0_0_8px_rgba(200,170,110,0.2)]" : ""}
        ${isLoser || isEliminated ? "border-[#1E2D3D]/20 bg-transparent opacity-25 cursor-default" : ""}
        ${teamId && !onClick ? "border-[#1E2D3D] bg-[#0A1428] cursor-default" : ""}
      `}
    >
      {team ? (
        <>
          <div
            className="w-6 h-6 hex-clip flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${team.logoColor}22` }}
          >
            <span className="text-[9px] font-black leading-none" style={{ color: team.logoColor }}>
              {team.shortName.slice(0, 3)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className={`font-bold text-xs truncate ${isWinner ? "text-[#C8AA6E]" : "text-[#F0E6D3]"}`}>
              {team.shortName}
            </div>
            <div className="text-[10px] font-semibold leading-none mt-0.5" style={{ color: regionColor }}>
              {team.region}
            </div>
          </div>
          {isWinner && <div className="w-1.5 h-1.5 rounded-full bg-[#C8AA6E] flex-shrink-0" />}
        </>
      ) : (
        <span className="text-[#1E2D3D] text-xs italic">{label || "TBD"}</span>
      )}
    </button>
  );
}

interface MatchCardProps {
  matchId: string;
  groupId: string;
  title: string;
  team1Id?: string;
  team2Id?: string;
  winnerId?: string;
  onPick: (matchId: string, teamId: string) => void;
  disabled?: boolean;
  highlight?: string;
  liveResult?: MatchResult;
}

function MatchCard({ matchId, groupId, title, team1Id, team2Id, winnerId, onPick, disabled, highlight, liveResult }: MatchCardProps) {
  const sched = getSchedule(groupId, matchId);
  const status = liveResult?.status ?? (sched ? matchStatus(sched.startTime) : "upcoming");
  const isLive = status === "inProgress" || status === "live";
  const isCompleted = status === "completed";
  const isLocked = isCompleted;

  // Use live result winner to auto-set, override user pick visually
  const effectiveWinner = liveResult?.winnerId ?? winnerId;
  const score1 = liveResult?.score1;
  const score2 = liveResult?.score2;

  const canPick = !disabled && !isLocked && !!team1Id && !!team2Id;
  const borderColor = isLive ? "#E84057"
    : isCompleted ? "#00C050"
    : highlight === "upper" ? "#0BC4E3"
    : highlight === "lower" ? "#E84057"
    : "#1E2D3D";

  return (
    <div className="rounded-sm overflow-hidden" style={{ border: `1px solid ${borderColor}22` }}>
      <div
        className="text-[9px] font-black tracking-widest px-2 py-1 uppercase flex items-center justify-between"
        style={{ backgroundColor: `${borderColor}15`, color: borderColor }}
      >
        <span>{title}</span>
        <span className="flex items-center gap-1">
          {isLive && <Radio className="w-2.5 h-2.5 animate-pulse" />}
          {isLocked && !isLive && <Lock className="w-2.5 h-2.5 opacity-60" />}
          {sched && !isLive && !isCompleted && (
            <span className="text-[#3D5A6F] font-normal normal-case tracking-normal">
              {formatMatchTime(sched.startTime)}
            </span>
          )}
        </span>
      </div>
      <div className="p-1.5 bg-[#010A13]/60 space-y-1">
        <div className="flex items-center gap-1">
          <TeamSlot
            teamId={team1Id}
            isWinner={effectiveWinner === team1Id}
            isLoser={!!effectiveWinner && effectiveWinner !== team1Id}
            onClick={canPick ? () => onPick(matchId, team1Id!) : undefined}
            disabled={!canPick}
          />
          {(isLive || isCompleted) && score1 !== undefined && (
            <span className={`text-sm font-black tabular-nums w-5 text-center flex-shrink-0 ${effectiveWinner === team1Id ? "text-[#C8AA6E]" : "text-[#3D5A6F]"}`}>
              {score1}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 px-1">
          <div className="flex-1 h-px bg-[#1E2D3D]" />
          <Swords className="w-2.5 h-2.5 text-[#1E2D3D]" />
          <div className="flex-1 h-px bg-[#1E2D3D]" />
        </div>
        <div className="flex items-center gap-1">
          <TeamSlot
            teamId={team2Id}
            isWinner={effectiveWinner === team2Id}
            isLoser={!!effectiveWinner && effectiveWinner !== team2Id}
            onClick={canPick ? () => onPick(matchId, team2Id!) : undefined}
            disabled={!canPick}
          />
          {(isLive || isCompleted) && score2 !== undefined && (
            <span className={`text-sm font-black tabular-nums w-5 text-center flex-shrink-0 ${effectiveWinner === team2Id ? "text-[#C8AA6E]" : "text-[#3D5A6F]"}`}>
              {score2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Standing badge
function Standing({ rank, teamId }: { rank: number; teamId?: string }) {
  const team = teamId ? getTeamById(teamId) : undefined;
  const rankColors = ["#C8AA6E", "#A0B4C5", "#785A28", "#3D5A6F"];
  const rankLabels = ["1ST", "2ND", "3RD", "4TH"];
  const advances = rank <= 2;

  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-sm border ${
      advances ? "border-[#00C050]/30 bg-[#00C050]/5" : "border-[#1E2D3D]/30 bg-transparent"
    }`}>
      <span className="text-xs font-black w-7" style={{ color: rankColors[rank - 1] }}>
        {rankLabels[rank - 1]}
      </span>
      {team ? (
        <div className="flex items-center gap-1.5">
          <div
            className="w-5 h-5 hex-clip flex items-center justify-center"
            style={{ backgroundColor: `${team.logoColor}22` }}
          >
            <span className="text-[8px] font-black" style={{ color: team.logoColor }}>
              {team.shortName.slice(0, 3)}
            </span>
          </div>
          <span className="text-xs font-bold text-[#F0E6D3]">{team.shortName}</span>
          {advances && <div className="w-1.5 h-1.5 rounded-full bg-[#00C050]" />}
        </div>
      ) : (
        <span className="text-[#1E2D3D] text-xs italic">TBD</span>
      )}
    </div>
  );
}

export default function GroupBracket({ group, picks, onChange, liveResults = {} }: GroupBracketProps) {
  const [ubm1t1, ubm1t2] = group.ubm1;
  const [ubm2t1, ubm2t2] = group.ubm2;

  // Merge live results into effective picks (live results override user picks for display)
  const effectivePicks: GroupBracketPicks = { ...picks };
  if (liveResults.ubm1?.winnerId) effectivePicks.ubm1 = liveResults.ubm1.winnerId;
  if (liveResults.ubm2?.winnerId) effectivePicks.ubm2 = liveResults.ubm2.winnerId;
  if (liveResults.ubf?.winnerId)  effectivePicks.ubf  = liveResults.ubf.winnerId;
  if (liveResults.lbr1?.winnerId) effectivePicks.lbr1 = liveResults.lbr1.winnerId;
  if (liveResults.lbf?.winnerId)  effectivePicks.lbf  = liveResults.lbf.winnerId;

  // Derive participants using effective picks
  const ubfT1 = effectivePicks.ubm1;
  const ubfT2 = effectivePicks.ubm2;
  const lbr1T1 = effectivePicks.ubm1 ? [ubm1t1, ubm1t2].find(id => id !== effectivePicks.ubm1) : undefined;
  const lbr1T2 = effectivePicks.ubm2 ? [ubm2t1, ubm2t2].find(id => id !== effectivePicks.ubm2) : undefined;
  const lbfT1 = effectivePicks.ubf ? [ubfT1, ubfT2].find(id => id !== effectivePicks.ubf) : undefined;
  const lbfT2 = effectivePicks.lbr1;

  // Standings
  const first  = effectivePicks.ubf;
  const second = effectivePicks.lbf;
  const third  = effectivePicks.lbf && lbfT1 && lbfT2
    ? [lbfT1, lbfT2].find(id => id !== effectivePicks.lbf)
    : undefined;
  const fourth = effectivePicks.lbr1 && lbr1T1 && lbr1T2
    ? [lbr1T1, lbr1T2].find(id => id !== effectivePicks.lbr1)
    : undefined;

  const handlePick = (matchId: string, teamId: string) => {
    const next = { ...picks, [matchId]: teamId };
    // Cascade: clear downstream picks that are no longer valid
    if (matchId === "ubm1") {
      // UBF participant changed
      if (next.ubf && ubfT1 && ubfT2) {
        const newUbfParticipants = [teamId, picks.ubm2].filter(Boolean);
        if (!newUbfParticipants.includes(next.ubf)) delete next.ubf;
      }
      // LBR1 participant changed
      const newLbr1T1 = [ubm1t1, ubm1t2].find(id => id !== teamId);
      if (next.lbr1 && newLbr1T1) {
        // Check if lbr1 winner is still a valid participant
        const newLbr1Participants = [newLbr1T1, lbr1T2].filter(Boolean);
        if (!newLbr1Participants.includes(next.lbr1)) delete next.lbr1;
      }
    }
    if (matchId === "ubm2") {
      if (next.ubf) {
        const newUbfParticipants = [picks.ubm1, teamId].filter(Boolean);
        if (!newUbfParticipants.includes(next.ubf)) delete next.ubf;
      }
      const newLbr1T2 = [ubm2t1, ubm2t2].find(id => id !== teamId);
      if (next.lbr1 && newLbr1T2) {
        const newLbr1Participants = [lbr1T1, newLbr1T2].filter(Boolean);
        if (!newLbr1Participants.includes(next.lbr1)) delete next.lbr1;
      }
    }
    if (matchId === "ubf" || matchId === "lbr1") {
      // LBF participants changed — clear lbf
      if (next.lbf) {
        const newLbfT1 = matchId === "ubf"
          ? [ubfT1, ubfT2].find(id => id !== teamId)
          : lbfT1;
        const newLbfT2 = matchId === "lbr1" ? teamId : lbfT2;
        const newLbfParticipants = [newLbfT1, newLbfT2].filter(Boolean);
        if (!newLbfParticipants.includes(next.lbf)) delete next.lbf;
      }
    }
    onChange(group.id, next);
  };

  return (
    <div className="lol-panel rounded-sm p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-6 bg-[#C8AA6E] rounded-full" />
        <h3 className="text-[#C8AA6E] font-black tracking-widest text-sm uppercase">{group.name}</h3>
        <div className="flex-1 h-px bg-[#1E2D3D]" />
        <span className="text-[#3D5A6F] text-[10px] tracking-wider">Double Elimination • BO5</span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-2 items-start">

        {/* Column 1: UB R1 matches */}
        <div className="space-y-8">
          <div>
            <div className="text-[#0BC4E3] text-[9px] font-black tracking-widest mb-1.5 text-center">UB ROUND 1</div>
            <MatchCard
              matchId="ubm1" groupId={group.id}
              title="UB Match 1"
              team1Id={ubm1t1} team2Id={ubm1t2}
              winnerId={picks.ubm1}
              onPick={handlePick} highlight="upper"
              liveResult={liveResults.ubm1}
            />
          </div>
          <div className="mt-2">
            <MatchCard
              matchId="ubm2" groupId={group.id}
              title="UB Match 2"
              team1Id={ubm2t1} team2Id={ubm2t2}
              winnerId={picks.ubm2}
              onPick={handlePick} highlight="upper"
              liveResult={liveResults.ubm2}
            />
          </div>
        </div>

        {/* Arrow right (upper) */}
        <div className="flex flex-col items-center justify-center h-full pt-8">
          <div className="text-[#0BC4E3]/40 text-lg">→</div>
        </div>

        {/* Column 2: UB Final + LB R1 */}
        <div className="space-y-3">
          <div>
            <div className="text-[#0BC4E3] text-[9px] font-black tracking-widest mb-1.5 text-center">UB FINAL</div>
            <MatchCard
              matchId="ubf" groupId={group.id}
              title="Upper Final"
              team1Id={ubfT1} team2Id={ubfT2}
              winnerId={picks.ubf}
              onPick={handlePick}
              disabled={!ubfT1 || !ubfT2}
              highlight="upper"
              liveResult={liveResults.ubf}
            />
          </div>

          <div className="flex items-center gap-1 my-1">
            <div className="flex-1 h-px bg-[#1E2D3D]" />
            <span className="text-[#3D5A6F] text-[9px] tracking-wider">LB</span>
            <div className="flex-1 h-px bg-[#1E2D3D]" />
          </div>

          <div>
            <div className="text-[#E84057] text-[9px] font-black tracking-widest mb-1.5 text-center">LB ROUND 1</div>
            <MatchCard
              matchId="lbr1" groupId={group.id}
              title="LB Match 1"
              team1Id={lbr1T1} team2Id={lbr1T2}
              winnerId={picks.lbr1}
              onPick={handlePick}
              disabled={!lbr1T1 || !lbr1T2}
              highlight="lower"
              liveResult={liveResults.lbr1}
            />
          </div>
        </div>

        {/* Arrow right (middle) */}
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-[#C8AA6E]/40 text-lg">→</div>
        </div>

        {/* Column 3: LB Final + Standings */}
        <div className="space-y-3">
          <div>
            <div className="text-[#E84057] text-[9px] font-black tracking-widest mb-1.5 text-center">LB FINAL</div>
            <MatchCard
              matchId="lbf" groupId={group.id}
              title="LB Final"
              team1Id={lbfT1} team2Id={lbfT2}
              winnerId={picks.lbf}
              onPick={handlePick}
              disabled={!lbfT1 || !lbfT2}
              highlight="lower"
              liveResult={liveResults.lbf}
            />
          </div>

          {/* Standings */}
          <div className="mt-3">
            <div className="text-[#3D5A6F] text-[9px] font-black tracking-widest mb-1.5 text-center">STANDINGS</div>
            <div className="space-y-1">
              <Standing rank={1} teamId={first} />
              <Standing rank={2} teamId={second} />
              <Standing rank={3} teamId={third} />
              <Standing rank={4} teamId={fourth} />
            </div>
          </div>
        </div>
      </div>

      {/* Winner earns MSI bye note */}
      <div className="mt-4 flex items-center gap-2">
        <Trophy className="w-3 h-3 text-[#C8AA6E]" />
        <p className="text-[#3D5A6F] text-[10px]">
          Top 2 advance to Playoffs • Winner earns bye into MSI bracket stage
        </p>
      </div>
    </div>
  );
}
