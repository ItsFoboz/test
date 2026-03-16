"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { getTeamById, REGION_COLORS, GROUPS, GroupBracketPicks, getGroupStandings } from "@/lib/tournament";
import { Trophy, User, Clock, ChevronDown, ChevronUp, Medal } from "lucide-react";

interface Pick {
  userId: string;
  displayName: string;
  photoURL?: string;
  groupBrackets: Record<string, GroupBracketPicks>;
  bracketWinners: Record<string, string>;
  champion?: string;
  submittedAt: number;
}

function PickDetail({ pick }: { pick: Pick }) {
  const [open, setOpen] = useState(false);
  const champion = pick.champion ? getTeamById(pick.champion) : undefined;

  return (
    <div className="border border-[#1E2D3D] rounded-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 hover:bg-[#0A1428]/50 transition-colors"
      >
        <span className="text-[#A0B4C5] text-xs tracking-wider">View picks</span>
        {open ? <ChevronUp className="w-4 h-4 text-[#3D5A6F]" /> : <ChevronDown className="w-4 h-4 text-[#3D5A6F]" />}
      </button>

      {open && (
        <div className="p-4 border-t border-[#1E2D3D] space-y-4 bg-[#010A13]/50">
          {/* Group standings */}
          <div>
            <div className="text-[#3D5A6F] text-xs tracking-widest mb-2 font-semibold">GROUP STANDINGS</div>
            <div className="grid grid-cols-2 gap-2">
              {GROUPS.map((group) => {
                const brackets = pick.groupBrackets?.[group.id] || {};
                const standings = getGroupStandings(group, brackets);
                return (
                  <div key={group.id} className="bg-[#0A1428] rounded-sm p-2">
                    <div className="text-[#C8AA6E] text-xs font-bold mb-1">{group.name}</div>
                    {standings.map((teamId, idx) => {
                      const team = teamId ? getTeamById(teamId) : undefined;
                      return (
                        <div key={idx} className={`flex items-center gap-1 text-xs py-0.5 ${idx >= 2 ? "opacity-40" : ""}`}>
                          <span className="text-[#3D5A6F] w-3">{idx + 1}.</span>
                          {team ? (
                            <>
                              <span className="text-[8px] font-black px-1 rounded"
                                style={{ color: REGION_COLORS[team.region], backgroundColor: `${REGION_COLORS[team.region]}11` }}>
                                {team.shortName}
                              </span>
                              <span className="text-[#A0B4C5] truncate">{team.name}</span>
                            </>
                          ) : <span className="text-[#1E2D3D] italic">TBD</span>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Playoff picks */}
          <div>
            <div className="text-[#3D5A6F] text-xs tracking-widest mb-2 font-semibold">PLAYOFF PICKS</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[#A855F7] text-xs mb-1">Semifinals</div>
                {["sf1", "sf2"].map((id) => {
                  const winner = pick.bracketWinners?.[id];
                  const team = winner ? getTeamById(winner) : undefined;
                  return (
                    <div key={id} className="flex items-center gap-1 text-xs py-0.5">
                      <span className="text-[#3D5A6F] w-7">{id.toUpperCase()}</span>
                      {team ? <span className="text-[#F0E6D3] font-semibold">{team.shortName}</span>
                            : <span className="text-[#1E2D3D] italic">TBD</span>}
                    </div>
                  );
                })}
              </div>
              <div>
                <div className="text-[#C8AA6E] text-xs mb-1">Champion</div>
                {champion ? (
                  <div className="flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-[#C8AA6E]" />
                    <span className="text-[#C8AA6E] font-bold text-xs">{champion.name}</span>
                  </div>
                ) : <span className="text-[#1E2D3D] text-xs italic">TBD</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(collection(db, "picks"), orderBy("submittedAt", "desc"));
        const snap = await getDocs(q);
        setPicks(snap.docs.map((d) => d.data() as Pick));
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const medalColors = ["#C8AA6E", "#A0B4C5", "#785A28"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-[#3D5A6F] text-sm tracking-widest animate-pulse">LOADING PICKS...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#F0E6D3] tracking-wider">
          <span className="shimmer-text">Community</span> Picks
        </h2>
        <p className="text-[#3D5A6F] text-sm mt-0.5">
          {picks.length} summoner{picks.length !== 1 ? "s" : ""} have submitted their prognosis
        </p>
      </div>

      {/* Champion popularity */}
      {picks.length > 0 && (() => {
        const counts: Record<string, number> = {};
        picks.forEach((p) => { if (p.champion) counts[p.champion] = (counts[p.champion] || 0) + 1; });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const total = picks.filter((p) => p.champion).length;
        if (sorted.length === 0) return null;
        return (
          <div className="lol-panel rounded-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-[#C8AA6E]" />
              <h3 className="text-[#C8AA6E] font-black tracking-widest text-sm uppercase">Champion Predictions</h3>
            </div>
            <div className="space-y-2">
              {sorted.map(([teamId, count], i) => {
                const team = getTeamById(teamId);
                if (!team) return null;
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={teamId} className="flex items-center gap-3">
                    <div className="w-5 text-right">
                      {i < 3 ? <Medal className="w-4 h-4 inline" style={{ color: medalColors[i] }} />
                              : <span className="text-[#3D5A6F] text-xs">{i + 1}</span>}
                    </div>
                    <div className="w-8 h-8 hex-clip flex items-center justify-center flex-shrink-0"
                         style={{ backgroundColor: `${team.logoColor}22` }}>
                      <span className="text-[10px] font-black" style={{ color: team.logoColor }}>{team.shortName.slice(0, 3)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[#F0E6D3] text-sm font-bold truncate">{team.name}</span>
                        <span className="text-xs font-semibold" style={{ color: REGION_COLORS[team.region] }}>{team.region}</span>
                      </div>
                      <div className="h-1.5 bg-[#1E2D3D] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                             style={{ width: `${pct}%`, backgroundColor: i === 0 ? "#C8AA6E" : i === 1 ? "#A0B4C5" : "#785A28" }} />
                      </div>
                    </div>
                    <div className="text-right w-16">
                      <div className="text-[#F0E6D3] text-sm font-bold">{Math.round(pct)}%</div>
                      <div className="text-[#3D5A6F] text-xs">{count} pick{count !== 1 ? "s" : ""}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* All picks */}
      <div className="space-y-3">
        {picks.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-12 h-12 text-[#1E2D3D] mx-auto mb-4" />
            <p className="text-[#3D5A6F] text-sm tracking-wider">No picks submitted yet.</p>
            <p className="text-[#1E2D3D] text-xs mt-1">Be the first to submit your prognosis!</p>
          </div>
        ) : picks.map((pick, idx) => {
          const champion = pick.champion ? getTeamById(pick.champion) : undefined;
          const isMe = pick.userId === user?.uid;
          const date = new Date(pick.submittedAt);
          return (
            <div key={pick.userId} className={`lol-panel rounded-sm p-4 ${isMe ? "border-[#C8AA6E]/30" : ""}`}>
              {isMe && <div className="text-[#C8AA6E] text-xs tracking-widest mb-2 font-semibold">★ YOUR PICKS</div>}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 text-center">
                  {idx < 3 ? <Medal className="w-5 h-5 inline" style={{ color: medalColors[idx] }} />
                           : <span className="text-[#3D5A6F] text-sm font-bold">#{idx + 1}</span>}
                </div>
                {pick.photoURL
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={pick.photoURL} alt="" className="w-9 h-9 rounded-full border border-[#1E2D3D]" />
                  : <div className="w-9 h-9 rounded-full bg-[#1E2D3D] flex items-center justify-center">
                      <User className="w-5 h-5 text-[#3D5A6F]" />
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <div className="text-[#F0E6D3] font-bold text-sm truncate">{pick.displayName}</div>
                  <div className="flex items-center gap-1 text-[#3D5A6F] text-xs">
                    <Clock className="w-3 h-3" />
                    {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                {champion && (
                  <div className="flex items-center gap-2 lol-panel px-3 py-1.5 rounded-sm">
                    <Trophy className="w-3 h-3 text-[#C8AA6E]" />
                    <div>
                      <div className="text-[#C8AA6E] text-xs font-black">{champion.shortName}</div>
                      <div className="text-[#3D5A6F] text-[10px]">champion</div>
                    </div>
                  </div>
                )}
              </div>
              <PickDetail pick={pick} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
