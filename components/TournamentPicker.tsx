"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import {
  GROUPS,
  getTeamById,
  Team,
  PickData,
} from "@/lib/tournament";
import GroupPicker from "./GroupPicker";
import BracketPicker from "./BracketPicker";
import { Save, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";

type Step = "groups" | "bracket";

const DEFAULT_GROUP_RANKINGS = Object.fromEntries(
  GROUPS.map((g) => [g.id, g.teams.map((t) => t.id)])
);

function buildSemifinals(groupResults: Record<string, string[]>) {
  // A1 vs B2, B1 vs A2
  const a = groupResults["groupA"] || GROUPS[0].teams.map(t => t.id);
  const b = groupResults["groupB"] || GROUPS[1].teams.map(t => t.id);

  return [
    { id: "sf1", label: "SF1 — A1 vs B2", team1: getTeamById(a[0]), team2: getTeamById(b[1]) },
    { id: "sf2", label: "SF2 — B1 vs A2", team1: getTeamById(b[0]), team2: getTeamById(a[1]) },
  ];
}

function buildFinal(sfWinners: Record<string, string>) {
  const getWinner = (matchId: string): Team | undefined => {
    const winner = sfWinners[matchId];
    return winner ? getTeamById(winner) : undefined;
  };
  return {
    id: "final",
    label: "Grand Final",
    team1: getWinner("sf1"),
    team2: getWinner("sf2"),
    winner: sfWinners["final"],
  };
}

export default function TournamentPicker() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("groups");
  const [groupRankings, setGroupRankings] = useState<Record<string, string[]>>(DEFAULT_GROUP_RANKINGS);
  const [bracketWinners, setBracketWinners] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "picks", user.uid));
        if (snap.exists()) {
          const data = snap.data() as PickData;
          if (data.groupResults) setGroupRankings(data.groupResults);
          if (data.bracketWinners) setBracketWinners(data.bracketWinners);
        }
      } catch {
        // ignore
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, [user]);

  const handleGroupChange = (groupId: string, ranking: string[]) => {
    const newRankings = { ...groupRankings, [groupId]: ranking };
    setGroupRankings(newRankings);

    // Clear bracket winners that are no longer valid advancing teams
    const advancing = new Set<string>();
    GROUPS.forEach((g) => {
      const r = newRankings[g.id] || g.teams.map(t => t.id);
      advancing.add(r[0]);
      advancing.add(r[1]);
    });
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
      // If SF changed, clear final if it's no longer valid
      if (matchId === "sf1" || matchId === "sf2") {
        const finalWinner = next["final"];
        const finalTeams = [next["sf1"], next["sf2"]];
        if (finalWinner && !finalTeams.includes(finalWinner)) delete next["final"];
      }
      return next;
    });
    setSaveStatus("idle");
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const picks: PickData = {
        groupResults: groupRankings,
        bracketWinners,
        champion: bracketWinners["final"],
      };
      await setDoc(doc(db, "picks", user.uid), {
        ...picks,
        userId: user.uid,
        displayName: user.displayName || user.email?.split("@")[0] || "Summoner",
        photoURL: user.photoURL || null,
        submittedAt: Date.now(),
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const sfMatches = buildSemifinals(groupRankings);
  const sfWithWinners = sfMatches.map((m) => ({ ...m, winner: bracketWinners[m.id] }));
  const finalMatch = buildFinal(bracketWinners);

  const allGroupsDone = GROUPS.every((g) => (groupRankings[g.id]?.length ?? 0) === g.teams.length);
  const sfDone = ["sf1", "sf2"].every((id) => bracketWinners[id]);
  const finalDone = !!bracketWinners["final"];
  const allDone = allGroupsDone && sfDone && finalDone;

  const progressSteps = [
    { label: "Groups", done: allGroupsDone },
    { label: "Semifinals", done: sfDone },
    { label: "Champion", done: finalDone },
  ];
  const completedSteps = progressSteps.filter((s) => s.done).length;
  const progressPct = (completedSteps / progressSteps.length) * 100;

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-[#3D5A6F] text-sm tracking-widest animate-pulse">LOADING PICKS...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#F0E6D3] tracking-wider">
            Your <span className="shimmer-text">Prognosis</span>
          </h2>
          <p className="text-[#3D5A6F] text-sm mt-0.5">
            Predict how First Stand 2026 will unfold
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !allDone}
          className={`btn-gold px-6 py-2.5 rounded-sm text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${allDone ? "pulse-gold" : ""}`}
        >
          {saveStatus === "saved" ? (
            <><CheckCircle className="w-4 h-4" /> Saved!</>
          ) : saveStatus === "error" ? (
            <><AlertCircle className="w-4 h-4" /> Error</>
          ) : (
            <><Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Picks"}</>
          )}
        </button>
      </div>

      {/* Progress */}
      <div className="lol-panel rounded-sm p-4">
        <div className="flex justify-between mb-2">
          {progressSteps.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${s.done ? "bg-[#C8AA6E] border-[#C8AA6E]" : "border-[#1E2D3D]"}`}>
                {s.done && <div className="w-2 h-2 bg-[#010A13] rounded-full" />}
              </div>
              <span className={`text-xs font-semibold tracking-wider ${s.done ? "text-[#C8AA6E]" : "text-[#3D5A6F]"}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <div className="h-1 bg-[#1E2D3D] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#785A28] to-[#C8AA6E] transition-all duration-500 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-[#3D5A6F] text-xs mt-1.5 text-right">
          {completedSteps}/{progressSteps.length} stages completed
        </p>
      </div>

      {/* Step tabs */}
      <div className="flex border-b border-[#1E2D3D]">
        {(["groups", "bracket"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            className={`px-6 py-3 text-sm font-semibold tracking-widest uppercase transition-all ${
              step === s
                ? "text-[#C8AA6E] border-b-2 border-[#C8AA6E] -mb-px"
                : "text-[#3D5A6F] hover:text-[#A0B4C5]"
            }`}
          >
            {s === "groups" ? "Group Stage" : "Playoffs"}
          </button>
        ))}
      </div>

      {/* Group Stage */}
      {step === "groups" && (
        <div>
          <div className="bg-[#0BC4E3]/5 border border-[#0BC4E3]/20 rounded-sm p-3 mb-5 flex items-start gap-2">
            <div className="w-1 h-4 bg-[#0BC4E3] rounded-full mt-0.5 flex-shrink-0" />
            <p className="text-[#A0B4C5] text-xs leading-relaxed">
              Each group plays a <strong className="text-[#C8AA6E]">double-elimination bracket</strong> (BO5). Drag teams to predict their finishing order. The <strong className="text-[#C8AA6E]">top 2</strong> from each group advance to the Playoffs.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {GROUPS.map((group) => (
              <GroupPicker
                key={group.id}
                group={group}
                ranking={groupRankings[group.id] || group.teams.map((t) => t.id)}
                onChange={handleGroupChange}
              />
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setStep("bracket")}
              className="btn-outline-gold px-6 py-2.5 rounded-sm text-sm flex items-center gap-2"
            >
              Continue to Playoffs <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Playoffs */}
      {step === "bracket" && (
        <div>
          <div className="bg-[#C8AA6E]/5 border border-[#C8AA6E]/20 rounded-sm p-3 mb-5 flex items-start gap-2">
            <div className="w-1 h-4 bg-[#C8AA6E] rounded-full mt-0.5 flex-shrink-0" />
            <p className="text-[#A0B4C5] text-xs leading-relaxed">
              Playoffs are <strong className="text-[#C8AA6E]">single elimination (BO5)</strong>. A1 vs B2 and B1 vs A2 in the Semifinals. Click a team to pick them as the winner.
            </p>
          </div>
          <BracketPicker
            quarterfinals={[]}
            semifinals={sfWithWinners}
            final={finalMatch}
            onPickWinner={handlePickWinner}
            champion={bracketWinners["final"]}
          />
        </div>
      )}
    </div>
  );
}
