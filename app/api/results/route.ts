import { NextResponse } from "next/server";
import { SCHEDULE } from "@/lib/schedule";

const LOL_API_KEY = "0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z";
const TOURNAMENT_ID = "115570858980956868";
const HEADERS = { "x-api-key": LOL_API_KEY };

// Map lolesports team codes → our internal team IDs
const TEAM_CODE_MAP: Record<string, string> = {
  BLG: "blg", BFX: "bfx", G2: "g2", TSW: "tsw",
  GEN: "geng", JDG: "jdg", LYON: "lyon", LOUD: "loud",
  // alternative spellings that may appear
  "BNK": "bfx", "GEN.G": "geng",
};

function resolveTeamId(code: string): string | null {
  if (!code) return null;
  const upper = code.toUpperCase();
  return TEAM_CODE_MAP[upper] || null;
}

export interface MatchResult {
  matchId: string;
  groupId: string;       // "groupA" | "groupB" | "playoffs"
  bracketMatchId: string; // "ubm1" | "ubm2" | "ubf" | "lbr1" | "lbf" | "sf1" | "sf2" | "final"
  team1Code: string;
  team2Code: string;
  team1Id: string | null;
  team2Id: string | null;
  score1: number;
  score2: number;
  winnerId: string | null;
  status: "unstarted" | "inProgress" | "completed";
  startTime: string; // ISO
}

export interface ResultsPayload {
  matches: MatchResult[];
  fetchedAt: string;
}

// In-memory cache: 60 second TTL
let cache: { data: ResultsPayload; ts: number } | null = null;
const CACHE_TTL = 60_000;

async function fetchStandings(): Promise<ResultsPayload> {
  const url = `https://esports-api.lolesports.com/persisted/gw/getStandings?hl=en-GB&tournamentId=${TOURNAMENT_ID}`;
  const res = await fetch(url, { headers: HEADERS, next: { revalidate: 0 } });

  if (!res.ok) throw new Error(`LoL API error: ${res.status}`);
  const json = await res.json();

  const matches: MatchResult[] = [];

  try {
    const stages = json?.data?.standings?.[0]?.stages ?? [];

    for (const stage of stages) {
      const sections = stage.sections ?? [];
      for (const section of sections) {
        const matches_raw = section.matches ?? [];
        for (const m of matches_raw) {
          const team1 = m.teams?.[0];
          const team2 = m.teams?.[1];
          if (!team1 || !team2) continue;

          const code1 = team1.code ?? team1.slug?.toUpperCase() ?? "";
          const code2 = team2.code ?? team2.slug?.toUpperCase() ?? "";
          const id1 = resolveTeamId(code1);
          const id2 = resolveTeamId(code2);
          const w = m.teams?.find((t: { result?: { outcome?: string } }) => t.result?.outcome === "win");
          const winnerId = w ? resolveTeamId(w.code ?? w.slug?.toUpperCase() ?? "") : null;

          const scheduled = findByStartTime(m.startTime ?? "");
          const groupId = scheduled?.groupId ?? inferGroupId(id1, id2);
          const bracketMatchId = scheduled?.bracketMatchId ?? inferBracketMatchId(m, section, id1, id2);

          matches.push({
            matchId: m.id ?? "",
            groupId,
            bracketMatchId,
            team1Code: code1,
            team2Code: code2,
            team1Id: id1,
            team2Id: id2,
            score1: team1.result?.gameWins ?? 0,
            score2: team2.result?.gameWins ?? 0,
            winnerId,
            status: m.state ?? "unstarted",
            startTime: m.startTime ?? "",
          });
        }
      }
    }
  } catch {
    // Return empty if parsing fails — frontend falls back gracefully
  }

  return { matches, fetchedAt: new Date().toISOString() };
}

function findByStartTime(startTime: string): { groupId: string; bracketMatchId: string } | null {
  if (!startTime) return null;
  const apiMs = new Date(startTime).getTime();
  if (isNaN(apiMs)) return null;
  for (const s of SCHEDULE) {
    if (Math.abs(apiMs - new Date(s.startTime).getTime()) < 30 * 60 * 1000) {
      return { groupId: s.groupId, bracketMatchId: s.bracketMatchId };
    }
  }
  return null;
}

function inferGroupId(id1: string | null, id2: string | null): string {
  const groupA = new Set(["blg", "bfx", "g2", "tsw"]);
  const groupB = new Set(["geng", "jdg", "lyon", "loud"]);
  if (id1 && groupA.has(id1)) return "groupA";
  if (id1 && groupB.has(id1)) return "groupB";
  if (id2 && groupA.has(id2)) return "groupA";
  if (id2 && groupB.has(id2)) return "groupB";
  return "playoffs";
}

function inferBracketMatchId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  m: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  section: any,
  id1: string | null,
  id2: string | null
): string {
  // Try to use bracket position data from the API
  const colPos = m.flags?.bracketColPosition ?? m.position ?? null;
  const rowPos = m.flags?.bracketRowPosition ?? m.row ?? null;

  // Use known fixed matchups for round 1
  const r1GroupA = (["blg","bfx"].includes(id1 ?? "") || ["blg","bfx"].includes(id2 ?? "")) &&
                    (["g2","tsw"].includes(id1 ?? "") === false);
  const r1GroupB = (["geng","jdg"].includes(id1 ?? "") || ["geng","jdg"].includes(id2 ?? "")) &&
                    (["lyon","loud"].includes(id1 ?? "") === false);

  const ids = [id1, id2].filter(Boolean);
  // Fixed Round 1 matchups
  if (ids.includes("blg") && ids.includes("bfx")) return "ubm1";
  if (ids.includes("g2") && ids.includes("tsw")) return "ubm2";
  if (ids.includes("geng") && ids.includes("jdg")) return "ubm1";
  if (ids.includes("lyon") && ids.includes("loud")) return "ubm2";

  // For TBD matches, use section/bracket hints
  const sectionName = (section.name ?? "").toLowerCase();
  const matchName = (m.name ?? m.type ?? "").toLowerCase();
  if (sectionName.includes("upper") || matchName.includes("upper")) {
    if (colPos === 2 || matchName.includes("final")) return "ubf";
    return "ubm1";
  }
  if (sectionName.includes("lower") || matchName.includes("lower")) {
    if (colPos === 2 || matchName.includes("final")) return "lbf";
    return "lbr1";
  }

  // Playoff matches
  if (inferGroupId(id1, id2) === "playoffs") {
    if (colPos === 2 || matchName.includes("final")) return "final";
    return rowPos === 1 ? "sf1" : "sf2";
  }

  return "unknown";
}

export async function GET() {
  try {
    const now = Date.now();
    if (cache && now - cache.ts < CACHE_TTL) {
      return NextResponse.json(cache.data);
    }
    const data = await fetchStandings();
    cache = { data, ts: now };
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch results";
    // Return empty payload — frontend will handle gracefully
    return NextResponse.json(
      { matches: [], fetchedAt: new Date().toISOString(), error: msg },
      { status: 200 }
    );
  }
}
