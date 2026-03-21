"use client";

import { MatchResult } from "@/hooks/useResults";
import { SCHEDULE, formatMatchTime, matchStatus } from "@/lib/schedule";
import { getTeamById, REGION_COLORS } from "@/lib/tournament";
import { RefreshCw, Radio, Clock, CheckCircle2 } from "lucide-react";

interface ResultsBannerProps {
  results: Record<string, Record<string, MatchResult>>;
  fetchedAt: string | null;
  loading: boolean;
  onRefresh: () => void;
}

function MatchTile({ schedule, result }: {
  schedule: typeof SCHEDULE[0];
  result?: MatchResult;
}) {
  const status = result?.status ?? matchStatus(schedule.startTime);
  const t1Id = result?.team1Id ?? schedule.team1Id;
  const t2Id = result?.team2Id ?? schedule.team2Id;
  const t1 = t1Id ? getTeamById(t1Id) : undefined;
  const t2 = t2Id ? getTeamById(t2Id) : undefined;
  const score1 = result?.score1 ?? 0;
  const score2 = result?.score2 ?? 0;

  const statusColor = status === "completed" ? "#00C050"
    : status === "inProgress" || status === "live" ? "#E84057"
    : "#3D5A6F";

  const statusIcon = status === "completed" ? <CheckCircle2 className="w-3 h-3" />
    : status === "inProgress" || status === "live" ? <Radio className="w-3 h-3 animate-pulse" />
    : <Clock className="w-3 h-3" />;

  const isLive = status === "inProgress" || status === "live";
  const isDone = status === "completed";

  return (
    <div className={`
      flex-shrink-0 rounded-sm border p-2 min-w-[140px]
      ${isLive ? "border-[#E84057]/50 bg-[#E84057]/5 shadow-[0_0_10px_rgba(232,64,87,0.15)]" : ""}
      ${isDone ? "border-[#1E2D3D] bg-[#010A13]" : ""}
      ${!isLive && !isDone ? "border-[#1E2D3D]/50 bg-transparent" : ""}
    `}>
      {/* Status + date */}
      <div className="flex items-center gap-1 mb-1.5" style={{ color: statusColor }}>
        {statusIcon}
        <span className="text-[9px] font-black tracking-widest uppercase">
          {isLive ? "LIVE" : isDone ? "FINAL" : formatMatchTime(schedule.startTime)}
        </span>
      </div>

      {/* Teams */}
      {t1 && t2 ? (
        <div className="space-y-1">
          {[{ team: t1, id: t1Id, score: score1, won: isDone && score1 > score2 },
            { team: t2, id: t2Id, score: score2, won: isDone && score2 > score1 }
          ].map(({ team, score, won }, i) => (
            <div key={i} className={`flex items-center gap-1.5 ${isDone && !won ? "opacity-35" : ""}`}>
              <div
                className="w-5 h-5 hex-clip flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${team.logoColor}22` }}
              >
                <span className="text-[7px] font-black" style={{ color: team.logoColor }}>
                  {team.shortName.slice(0, 3)}
                </span>
              </div>
              <span className={`text-xs font-bold flex-1 truncate ${won ? "text-[#C8AA6E]" : "text-[#A0B4C5]"}`}>
                {team.shortName}
              </span>
              {isDone && (
                <span className={`text-xs font-black tabular-nums ${won ? "text-[#C8AA6E]" : "text-[#3D5A6F]"}`}>
                  {score}
                </span>
              )}
              {isLive && (
                <span className="text-xs font-black text-[#E84057] tabular-nums">{score}</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[#1E2D3D] text-xs italic py-1">TBD vs TBD</div>
      )}

      {/* Match label */}
      <div className="text-[#3D5A6F] text-[9px] tracking-wider mt-1.5 truncate">{schedule.label}</div>
    </div>
  );
}

export default function ResultsBanner({ results, fetchedAt, loading, onRefresh }: ResultsBannerProps) {
  const now = new Date();

  // Priority 1: any match the API reports as live right now
  const live = SCHEDULE.filter(s => results[s.groupId]?.[s.bracketMatchId]?.status === "inProgress");

  // Priority 2: most recent completed + upcoming (within ±8h of now by schedule)
  const recent = SCHEDULE.filter(s => {
    const result = results[s.groupId]?.[s.bracketMatchId];
    if (result?.status === "inProgress") return false; // already in live
    if (result?.status === "completed") {
      const start = new Date(s.startTime);
      return now.getTime() - start.getTime() < 8 * 60 * 60 * 1000; // completed within 8h
    }
    const start = new Date(s.startTime);
    const diff = now.getTime() - start.getTime();
    return diff > -8 * 60 * 60 * 1000 && diff < 0; // upcoming within 8h
  });

  // If nothing recent/live, fall back to next 4 upcoming
  const upcoming = SCHEDULE.filter(s => {
    const start = new Date(s.startTime);
    return start.getTime() > now.getTime();
  }).slice(0, 4);

  const displayed = live.length > 0 || recent.length > 0
    ? [...live, ...recent]
    : upcoming;

  return (
    <div className="border-b border-[#1E2D3D] bg-[#010A13]">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#E84057] animate-pulse" />
            <span className="text-[#C8AA6E] text-xs font-black tracking-widest">LIVE RESULTS</span>
          </div>
          <div className="flex-1 h-px bg-[#1E2D3D]" />
          <button
            onClick={onRefresh}
            className="text-[#3D5A6F] hover:text-[#C8AA6E] transition-colors flex items-center gap-1 text-xs"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            {fetchedAt ? `Updated ${new Date(fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Refresh"}
          </button>
        </div>

        {/* Scrollable match tiles */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {displayed.map(s => {
            const result = results[s.groupId]?.[s.bracketMatchId];
            return <MatchTile key={`${s.groupId}-${s.bracketMatchId}`} schedule={s} result={result} />;
          })}
          {displayed.length === 0 && (
            <div className="text-[#1E2D3D] text-xs italic py-2">No matches scheduled yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
