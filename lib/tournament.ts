export type Region = "LCK" | "LPL" | "LEC" | "LCS" | "LCP" | "CBLOL";

export interface Team {
  id: string;
  name: string;
  shortName: string;
  region: Region;
  seed: number;
  logoColor: string;
}

export interface Match {
  id: string;
  round: number;
  position: number;
  team1?: Team;
  team2?: Team;
  winner?: string;
}

export interface Group {
  id: string;
  name: string;
  teams: Team[];
}

export interface UserPick {
  userId: string;
  displayName: string;
  photoURL?: string;
  picks: PickData;
  submittedAt: number;
  score?: number;
}

export interface PickData {
  groupResults: Record<string, string[]>; // group id -> ordered team ids (1st to 4th)
  bracketWinners: Record<string, string>; // match id -> winning team id
  champion?: string;
}

// First Stand 2026 — Real Teams
export const TEAMS: Team[] = [
  // LCK
  { id: "geng", name: "Gen.G Esports", shortName: "GEN", region: "LCK", seed: 1, logoColor: "#C8AA6E" },
  { id: "bfx",  name: "BNK FearX",     shortName: "BFX", region: "LCK", seed: 2, logoColor: "#FF4D7A" },
  // LPL
  { id: "blg",  name: "Bilibili Gaming", shortName: "BLG", region: "LPL", seed: 1, logoColor: "#FF69B4" },
  { id: "jdg",  name: "JD Gaming",       shortName: "JDG", region: "LPL", seed: 2, logoColor: "#00BFFF" },
  // LEC
  { id: "g2",   name: "G2 Esports",      shortName: "G2",  region: "LEC", seed: 1, logoColor: "#00C050" },
  // LCP (Pacific)
  { id: "tsw",  name: "Team Secret Whales", shortName: "TSW", region: "LCP", seed: 1, logoColor: "#A855F7" },
  // LCS
  { id: "lyon", name: "LYON",            shortName: "LYON", region: "LCS", seed: 1, logoColor: "#0080FF" },
  // CBLOL
  { id: "loud", name: "LOUD",            shortName: "LOUD", region: "CBLOL", seed: 1, logoColor: "#00FF7F" },
];

// Group Stage — 2 groups of 4, double-elimination format
export const GROUPS: Group[] = [
  {
    id: "groupA",
    name: "Group A",
    teams: [
      TEAMS.find(t => t.id === "blg")!,
      TEAMS.find(t => t.id === "bfx")!,
      TEAMS.find(t => t.id === "g2")!,
      TEAMS.find(t => t.id === "tsw")!,
    ],
  },
  {
    id: "groupB",
    name: "Group B",
    teams: [
      TEAMS.find(t => t.id === "geng")!,
      TEAMS.find(t => t.id === "jdg")!,
      TEAMS.find(t => t.id === "lyon")!,
      TEAMS.find(t => t.id === "loud")!,
    ],
  },
];

// Playoffs: top 2 from each group → Semifinals → Final
// A1 vs B2, B1 vs A2
export const SEMIFINAL_MATCHES: Match[] = [
  { id: "sf1", round: 1, position: 1 }, // A1 vs B2
  { id: "sf2", round: 1, position: 2 }, // B1 vs A2
];

export const FINAL_MATCH: Match = { id: "final", round: 2, position: 1 };

export const REGION_COLORS: Record<Region, string> = {
  LCK:   "#C8AA6E",
  LPL:   "#E84057",
  LEC:   "#00C050",
  LCS:   "#0080FF",
  LCP:   "#A855F7",
  CBLOL: "#00FF7F",
};

export const getTeamById = (id: string): Team | undefined => TEAMS.find(t => t.id === id);
