export type Region = "LCK" | "LPL" | "LEC" | "LCS" | "PCS" | "VCS" | "CBLOL" | "LLA" | "LCO";

export interface Team {
  id: string;
  name: string;
  shortName: string;
  region: Region;
  seed: number;
  logoColor: string; // fallback color if no logo
}

export interface Match {
  id: string;
  round: number;
  position: number;
  team1?: Team;
  team2?: Team;
  winner?: string; // team id
}

export interface Group {
  id: string;
  name: string;
  teams: Team[];
}

export interface TournamentStage {
  id: string;
  name: string;
  type: "groups" | "bracket";
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
  champion?: string; // team id
}

// First Stand 2026 Teams
export const TEAMS: Team[] = [
  // LCK
  { id: "t1", name: "T1", shortName: "T1", region: "LCK", seed: 1, logoColor: "#C8AA6E" },
  { id: "geng", name: "Gen.G", shortName: "GEN", region: "LCK", seed: 2, logoColor: "#E84057" },
  { id: "hanwha", name: "Hanwha Life", shortName: "HLE", region: "LCK", seed: 3, logoColor: "#FF6B35" },
  { id: "dplus", name: "Dplus KIA", shortName: "DK", region: "LCK", seed: 4, logoColor: "#5B9BD5" },
  // LPL
  { id: "bilibili", name: "Bilibili Gaming", shortName: "BLG", region: "LPL", seed: 1, logoColor: "#FF69B4" },
  { id: "weibo", name: "Weibo Gaming", shortName: "WBG", region: "LPL", seed: 2, logoColor: "#FF4444" },
  { id: "topesports", name: "Top Esports", shortName: "TES", region: "LPL", seed: 3, logoColor: "#FFA500" },
  { id: "jdg", name: "JD Gaming", shortName: "JDG", region: "LPL", seed: 4, logoColor: "#00BFFF" },
  // LEC
  { id: "g2", name: "G2 Esports", shortName: "G2", region: "LEC", seed: 1, logoColor: "#00C050" },
  { id: "fnatic", name: "Fnatic", shortName: "FNC", region: "LEC", seed: 2, logoColor: "#FF6900" },
  { id: "mad", name: "MAD Lions", shortName: "MAD", region: "LEC", seed: 3, logoColor: "#A855F7" },
  // LCS
  { id: "cloud9", name: "Cloud9", shortName: "C9", region: "LCS", seed: 1, logoColor: "#0080FF" },
  { id: "100thieves", name: "100 Thieves", shortName: "100T", region: "LCS", seed: 2, logoColor: "#C8AA6E" },
  // International
  { id: "cfg", name: "CFG", shortName: "CFG", region: "PCS", seed: 1, logoColor: "#00CED1" },
  { id: "gam", name: "GAM Esports", shortName: "GAM", region: "VCS", seed: 1, logoColor: "#FF0080" },
  { id: "loud", name: "LOUD", shortName: "LOUD", region: "CBLOL", seed: 1, logoColor: "#00FF7F" },
];

// Group Stage
export const GROUPS: Group[] = [
  {
    id: "groupA",
    name: "Group A",
    teams: [
      TEAMS.find(t => t.id === "t1")!,
      TEAMS.find(t => t.id === "bilibili")!,
      TEAMS.find(t => t.id === "g2")!,
      TEAMS.find(t => t.id === "100thieves")!,
    ],
  },
  {
    id: "groupB",
    name: "Group B",
    teams: [
      TEAMS.find(t => t.id === "geng")!,
      TEAMS.find(t => t.id === "weibo")!,
      TEAMS.find(t => t.id === "fnatic")!,
      TEAMS.find(t => t.id === "cfg")!,
    ],
  },
  {
    id: "groupC",
    name: "Group C",
    teams: [
      TEAMS.find(t => t.id === "hanwha")!,
      TEAMS.find(t => t.id === "topesports")!,
      TEAMS.find(t => t.id === "cloud9")!,
      TEAMS.find(t => t.id === "gam")!,
    ],
  },
  {
    id: "groupD",
    name: "Group D",
    teams: [
      TEAMS.find(t => t.id === "dplus")!,
      TEAMS.find(t => t.id === "jdg")!,
      TEAMS.find(t => t.id === "mad")!,
      TEAMS.find(t => t.id === "loud")!,
    ],
  },
];

// Quarterfinal match structure (seeded by group results)
export const QUARTERFINAL_MATCHES: Match[] = [
  { id: "qf1", round: 1, position: 1 }, // A1 vs D2
  { id: "qf2", round: 1, position: 2 }, // B1 vs C2
  { id: "qf3", round: 1, position: 3 }, // C1 vs B2
  { id: "qf4", round: 1, position: 4 }, // D1 vs A2
];

export const SEMIFINAL_MATCHES: Match[] = [
  { id: "sf1", round: 2, position: 1 }, // QF1 winner vs QF2 winner
  { id: "sf2", round: 2, position: 2 }, // QF3 winner vs QF4 winner
];

export const FINAL_MATCH: Match = { id: "final", round: 3, position: 1 };

export const REGION_COLORS: Record<Region, string> = {
  LCK: "#C8AA6E",
  LPL: "#E84057",
  LEC: "#00C050",
  LCS: "#0080FF",
  PCS: "#00CED1",
  VCS: "#FF0080",
  CBLOL: "#00FF7F",
  LLA: "#FFD700",
  LCO: "#FF6347",
};

export const getTeamById = (id: string): Team | undefined => TEAMS.find(t => t.id === id);
