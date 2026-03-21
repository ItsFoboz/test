"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import {
  GROUPS,
  getTeamById,
  GroupBracketPicks,
  PickData,
  getGroupStandings,
} from "@/lib/tournament";
import { MatchResult } from "@/hooks/useResults";
import GroupBracket from "./GroupBracket";
import BracketPicker from "./BracketPicker";
import { Save, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";

type Step = "groups" | "bracket";

const DEFAULT_BRACKETS: Record<string, GroupBracketPicks> = Object.fromEntries(
  GROUPS.map((g) => [g.id, {}])
);

function buildSemifinals(groupBrackets: Record<string, GroupBracketPicks>) {
  const aStandings = getGroupStandings(GROUPS[0], groupBrackets["groupA"] || {});
  const bStandings = getGroupStandings(GROUPS[1], groupBrackets["groupB"] || {});
  const a1 = aStandings[0] ? getTeamById(aStandings[0]) : undefined;
  const a2 = aStandings[1] ? getTeamById(aStandings[1]) : undefined;
  const b1 = bStandings[0] ? getTeamById(bStandings[0]) : undefined;
  const b2 = bStandings[1] ? getTeamById(bStandings[1]) : undefined;
  return [
    { id: "sf1", label: "SF1 — A1 vs B2", team1: a1, team2: b2 },
    { id: "sf2", label: "SF2 — B1 vs A2", team1: b1, team2: a2 },
  ];
}

interface TournamentPickerProps {
  liveResults?: Record<string, Record<string, MatchResult>>;
}

export default function TournamentPicker({ liveResults = {} }: TournamentPickerProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("groups");
  const [groupBrackets, setGroupBrackets] = useState<Record<string, GroupBracketPicks>>(DEFAULT_BRACKETS);
  const [bracketWinners, setBracketWinners] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "picks", user.uid));
        if (snap.exists()) {
          const data = snap.data() as PickData;
          if (data.groupBrackets) setGroupBrackets(data.groupBrackets);
          if (data.bracketWinners) setBracketWinners(data.bracketWinners);
        }
      } catch {
        // ignore load errors silently
      } finally {
        setSyncing(false);
      }
    };
    load();
  }, [user]);

  const handleGroupChange = (groupId: string, picks: GroupBracketPicks) => {
    const newBrackets = { ...groupBrackets, [groupId]: picks };
    setGroupBrackets(newBrackets);
    // Clear playoff winners if advancing teams changed
    const aStandings = getGroupStandings(GROUPS[0], newBrackets["groupA"] || {});
    const bStandings = getGroupStandings(GROUPS[1], newBrackets["groupB"] || {});
    const advancing = new Set([aStandings[0], aStandings[1], bStandings[0], bStandings[1]].filter(Boolean));
    setBracketWinners((prev) => {
      const cleaned: Record<string, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        if (advancing.has(v)) cleaned[k] = v;
      }
      return cleaned;
    });
    setSaveStatus("idle");
  };

  const handlePickWinner = (matchId: string, teamId: string) => {
    setBracketWinners((prev) => {
      const next = { ...prev, [matchId]: teamId };
      if (matchId === "sf1" || matchId === "sf2") {
        const finalWinner = next["final"];
        if (finalWinner && ![next["sf1"], next["sf2"]].includes(finalWinner)) {
          delete next["final"];
        }
      }
      return next;
    });
    setSaveStatus("idle");
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError("");
    try {
      const champion = bracketWinners["final"];
      await setDoc(doc(db, "picks", user.uid), {
        groupBrackets,
        bracketWinners,
        champion: champion || null,
        userId: user.uid,
        displayName: user.displayName || user.email?.split("@")[0] || "Summoner",
        photoURL: user.photoURL || null,
        submittedAt: Date.now(),
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setSaveStatus("error");
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Progress
  const groupADone = !!(groupBrackets["groupA"]?.ubf && groupBrackets["groupA"]?.lbf);
  const groupBDone = !!(groupBrackets["groupB"]?.ubf && groupBrackets["groupB"]?.lbf);
  const allGroupsDone = groupADone && groupBDone;
  const sfDone = !!(bracketWinners["sf1"] && bracketWinners["sf2"]);
  const finalDone = !!bracketWinners["final"];
  const allDone = allGroupsDone && sfDone && finalDone;

  const progressSteps = [
    { label: "Group A", done: groupADone },
    { label: "Group B", done: groupBDone },
    { label: "Semifinals", done: sfDone },
    { label: "Champion", done: finalDone },
  ];
  const completedSteps = progressSteps.filter((s) => s.done).length;
  const progressPct = (completedSteps / progressSteps.length) * 100;

  // Build playoffs
  const sfMatches = buildSemifinals(groupBrackets);
  const sfWithWinners = sfMatches.map((m) => ({ ...m, winner: bracketWinners[m.id] }));
  const aStandings = getGroupStandings(GROUPS[0], groupBrackets["groupA"] || {});
  const bStandings = getGroupStandings(GROUPS[1], groupBrackets["groupB"] || {});
  const finalTeam1 = bracketWinners["sf1"] ? getTeamById(bracketWinners["sf1"]) : undefined;
  const finalTeam2 = bracketWinners["sf2"] ? getTeamById(bracketWinners["sf2"]) : undefined;
  const finalMatch = {
    id: "final",
    label: "Grand Final",
    team1: finalTeam1,
    team2: finalTeam2,
    winner: bracketWinners["final"],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#F0E6D3] tracking-wider">
            Your <span className="shimmer-text">Prognosis</span>
          </h2>
          <p className="text-[#3D5A6F] text-sm mt-0.5">
            {syncing ? "Syncing your picks..." : "Predict how First Stand 2026 will unfold"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={handleSave}
            disabled={saving || !allDone}
            className={`btn-gold px-6 py-2.5 rounded-sm text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${allDone ? "pulse-gold" : ""}`}
          >
            {saving ? (
              <><div className="w-4 h-4 border-2 border-[#010A13] border-t-transparent rounded-full animate-spin" /> Saving...</>
            ) : saveStatus === "saved" ? (
              <><CheckCircle className="w-4 h-4" /> Saved!</>
            ) : saveStatus === "error" ? (
              <><AlertCircle className="w-4 h-4" /> Failed</>
            ) : (
              <><Save className="w-4 h-4" /> Save Picks</>
            )}
          </button>
          {saveStatus === "error" && saveError && (
            <p className="text-[#E84057] text-xs max-w-xs text-right">{saveError}</p>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="lol-panel rounded-sm p-4">
        <div className="flex justify-between mb-2">
          {progressSteps.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${s.done ? "bg-[#C8AA6E] border-[#C8AA6E]" : "border-[#1E2D3D]"}`}>
                {s.done && <div className="w-2 h-2 bg-[#010A13] rounded-full" />}
              </div>
              <span className={`text-xs font-semibold tracking-wider ${s.done ? "text-[#C8AA6E]" : "text-[#3D5A6F]"}`}>{s.label}</span>
            </div>
          ))}
        </div>
        <div className="h-1 bg-[#1E2D3D] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#785A28] to-[#C8AA6E] transition-all duration-500 rounded-full" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="text-[#3D5A6F] text-xs mt-1.5 text-right">{completedSteps}/{progressSteps.length} stages completed</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1E2D3D]">
        {(["groups", "bracket"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            className={`px-6 py-3 text-sm font-semibold tracking-widest uppercase transition-all ${
              step === s ? "text-[#C8AA6E] border-b-2 border-[#C8AA6E] -mb-px" : "text-[#3D5A6F] hover:text-[#A0B4C5]"
            }`}
          >
            {s === "groups" ? "Group Stage" : "Playoffs"}
          </button>
        ))}
      </div>

      {step === "groups" && (
        <div className="space-y-4">
          <div className="bg-[#0BC4E3]/5 border border-[#0BC4E3]/20 rounded-sm p-3 flex items-start gap-2">
            <div className="w-1 h-4 bg-[#0BC4E3] rounded-full mt-0.5 flex-shrink-0" />
            <p className="text-[#A0B4C5] text-xs leading-relaxed">
              Each group plays a <strong className="text-[#C8AA6E]">double-elimination bracket (BO5)</strong>.
              Click a team in each match to pick the winner. Top 2 from each group advance to Playoffs.
            </p>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {GROUPS.map((group) => (
              <GroupBracket
                key={group.id}
                group={group}
                picks={groupBrackets[group.id] || {}}
                onChange={handleGroupChange}
                liveResults={liveResults[group.id] || {}}
              />
            ))}
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setStep("bracket")}
              className="btn-outline-gold px-6 py-2.5 rounded-sm text-sm flex items-center gap-2"
            >
              Continue to Playoffs <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === "bracket" && (
        <div className="space-y-4">
          <div className="bg-[#C8AA6E]/5 border border-[#C8AA6E]/20 rounded-sm p-3 flex items-start gap-2">
            <div className="w-1 h-4 bg-[#C8AA6E] rounded-full mt-0.5 flex-shrink-0" />
            <p className="text-[#A0B4C5] text-xs leading-relaxed">
              <strong className="text-[#C8AA6E]">Single elimination (BO5)</strong>. A1 vs B2 and B1 vs A2.
              {!allGroupsDone && <span className="text-[#E84057]"> — Complete both group brackets first to seed the playoff matches.</span>}
            </p>
          </div>

          {/* Show group standings summary */}
          {allGroupsDone && (
            <div className="grid grid-cols-2 gap-3">
              {[{ g: GROUPS[0], s: aStandings }, { g: GROUPS[1], s: bStandings }].map(({ g, s }) => (
                <div key={g.id} className="lol-panel rounded-sm p-3">
                  <div className="text-[#C8AA6E] text-xs font-black tracking-widest mb-2">{g.name} STANDINGS</div>
                  {s.map((tid, i) => {
                    const team = tid ? getTeamById(tid) : undefined;
                    return (
                      <div key={i} className={`flex items-center gap-2 text-xs py-0.5 ${i >= 2 ? "opacity-30" : ""}`}>
                        <span className="text-[#3D5A6F] w-4">{i + 1}.</span>
                        {team ? (
                          <>
                            <span className="font-bold text-[#F0E6D3]">{team.shortName}</span>
                            <span className="text-[10px]" style={{ color: "#" + team.logoColor.slice(1) }}>{team.region}</span>
                            {i < 2 && <span className="text-[#00C050] text-[10px] ml-auto">ADVANCES</span>}
                          </>
                        ) : <span className="text-[#1E2D3D] italic">TBD</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          <BracketPicker
            quarterfinals={[]}
            semifinals={sfWithWinners}
            final={finalMatch}
            onPickWinner={handlePickWinner}
            champion={bracketWinners["final"]}
            liveResults={liveResults["playoffs"] || {}}
          />
        </div>
      )}
    </div>
  );
}
