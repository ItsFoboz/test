import { NextResponse } from "next/server";

const LOL_API_KEY = "0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z";
const TOURNAMENT_ID = "115570858980956868";
const HEADERS = { "x-api-key": LOL_API_KEY };

// Map lolesports team codes → our internal team IDs
const TEAM_CODE_MAP: Record<string, string> = {
  BLG: "blg", BFX: "bfx", G2: "g2", TSW: "tsw",
  GEN: "geng", JDG: "jdg", LYON: "lyon", LOUD: "loud",
  BNK: "bfx", "GEN.G": "geng",
};

function resolveTeamId(code: string): string | null {
  if (!code) return null;
  return TEAM_CODE_MAP[code.toUpperCase()] || null;
}

export interface MatchResult {
  matchId: string;
  groupId: string;        // "groupA" | "groupB" | "playoffs"
  bracketMatchId: string; // "ubm1" | "ubm2" | "ubf" | "lbr1" | "lbf" | "sf1" | "sf2" | "final"
  team1Code: string;
  team2Code: string;
  team1Id: string | null;
  team2Id: string | null;
  score1: number;
  score2: number;
  winnerId: string | null;
  status: "unstarted" | "inProgress" | "completed";
  startTime: string;
}

export interface ResultsPayload {
  matches: MatchResult[];
  fetchedAt: string;
}

// In-memory cache: 60 second TTL
let cache: { data: ResultsPayload; ts: number } | null = null;
const CACHE_TTL = 60_000;

// The API returns matches within each section in this fixed bracket order.
// Verified against live API response for First Stand 2026.
const GROUP_BRACKET_ORDER = ["ubm1", "ubm2", "ubf", "lbf", "lbr1"] as const;
const PLAYOFF_ORDER = ["sf1", "sf2", "final"] as const;

function sectionToGroupId(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("group a")) return "groupA";
  if (n.includes("group b")) return "groupB";
  return "playoffs";
}

async function fetchStandings(): Promise<ResultsPayload> {
  const url = `https://esports-api.lolesports.com/persisted/gw/getStandings?hl=en-GB&tournamentId=${TOURNAMENT_ID}`;
  const res = await fetch(url, { headers: HEADERS, next: { revalidate: 0 } });

  if (!res.ok) throw new Error(`LoL API error: ${res.status}`);
  const json = await res.json();

  const matches: MatchResult[] = [];

  try {
    const stages = json?.data?.standings?.[0]?.stages ?? [];

    for (const stage of stages) {
      for (const section of stage.sections ?? []) {
        const groupId = sectionToGroupId(section.name ?? "");
        const order = groupId === "playoffs" ? PLAYOFF_ORDER : GROUP_BRACKET_ORDER;

        const matches_raw: unknown[] = section.matches ?? [];
        for (let i = 0; i < matches_raw.length; i++) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const m = matches_raw[i] as any;
          const team1 = m.teams?.[0];
          const team2 = m.teams?.[1];
          if (!team1 || !team2) continue;

          const code1 = team1.code ?? team1.slug?.toUpperCase() ?? "";
          const code2 = team2.code ?? team2.slug?.toUpperCase() ?? "";
          const id1 = resolveTeamId(code1);
          const id2 = resolveTeamId(code2);
          const w = m.teams?.find((t: { result?: { outcome?: string } }) => t.result?.outcome === "win");
          const winnerId = w ? resolveTeamId(w.code ?? w.slug?.toUpperCase() ?? "") : null;

          matches.push({
            matchId: m.id ?? "",
            groupId,
            bracketMatchId: order[i] ?? "unknown",
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
    return NextResponse.json(
      { matches: [], fetchedAt: new Date().toISOString(), error: msg },
      { status: 200 }
    );
  }
}
