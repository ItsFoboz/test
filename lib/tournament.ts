export type Region = "LCK" | "LPL" | "LEC" | "LCS" | "LCP" | "CBLOL";

export interface Team {
  id: string;
  name: string;
  shortName: string;
  region: Region;
  seed: number;
  logoColor: string;
}

export interface Group {
  id: string;
  name: string;
  // Upper bracket matchups (seeded)
  ubm1: [string, string]; // team ids
  ubm2: [string, string];
}

// Per-group double-elim picks
// ubm1, ubm2 → Upper Bracket Matches
// ubf         → Upper Bracket Final (ubm1 winner vs ubm2 winner) → 1st place
// lbr1        → Lower Bracket R1 (ubm1 loser vs ubm2 loser)    → loser = 4th
// lbf         → Lower Bracket Final (ubf loser vs lbr1 winner) → winner = 2nd, loser = 3rd
export interface GroupBracketPicks {
  ubm1?: string;
  ubm2?: string;
  ubf?: string;
  lbr1?: string;
  lbf?: string;
}

export interface PickData {
  groupBrackets: Record<string, GroupBracketPicks>; // group id → picks
  bracketWinners: Record<string, string>;           // playoff match id → team id
  champion?: string;
}

// Derives final group standings [1st, 2nd, 3rd, 4th] from bracket picks
export function getGroupStandings(
  group: Group,
  picks: GroupBracketPicks
): (string | undefined)[] {
  const first  = picks.ubf;                    // UBF winner
  const second = picks.lbf;                    // LBF winner
  // 3rd = LBF loser (whichever of ubf-loser and lbr1-winner didn't win LBF)
  const ubfLoser = picks.ubf
    ? [group.ubm1[0], group.ubm1[1], group.ubm2[0], group.ubm2[1]].find(
        (id) => {
          const ubm1Winner = picks.ubm1;
          const ubm2Winner = picks.ubm2;
          if (!ubm1Winner || !ubm2Winner) return false;
          // ubf participants are ubm1 winner and ubm2 winner
          return (id === ubm1Winner || id === ubm2Winner) && id !== picks.ubf;
        }
      )
    : undefined;
  const lbr1Winner = picks.lbr1;
  const third = picks.lbf
    ? [ubfLoser, lbr1Winner].find((id) => id && id !== picks.lbf)
    : undefined;
  // 4th = LBR1 loser
  const lbr1Participants = picks.ubm1 && picks.ubm2
    ? [group.ubm1, group.ubm2].flatMap(([a, b]) => [a, b]).filter(
        (id) => id !== picks.ubm1 && id !== picks.ubm2
      )
    : [];
  const fourth = picks.lbr1
    ? lbr1Participants.find((id) => id !== picks.lbr1)
    : undefined;

  return [first, second, third, fourth];
}

// First Stand 2026 — Real Teams
export const TEAMS: Team[] = [
  { id: "geng", name: "Gen.G Esports",      shortName: "GEN",  region: "LCK",   seed: 1, logoColor: "#C8AA6E" },
  { id: "bfx",  name: "BNK FearX",          shortName: "BFX",  region: "LCK",   seed: 2, logoColor: "#FF4D7A" },
  { id: "blg",  name: "Bilibili Gaming",    shortName: "BLG",  region: "LPL",   seed: 1, logoColor: "#FF69B4" },
  { id: "jdg",  name: "JD Gaming",          shortName: "JDG",  region: "LPL",   seed: 2, logoColor: "#00BFFF" },
  { id: "g2",   name: "G2 Esports",         shortName: "G2",   region: "LEC",   seed: 1, logoColor: "#00C050" },
  { id: "tsw",  name: "Team Secret Whales", shortName: "TSW",  region: "LCP",   seed: 1, logoColor: "#A855F7" },
  { id: "lyon", name: "LYON",               shortName: "LYON", region: "LCS",   seed: 1, logoColor: "#0080FF" },
  { id: "loud", name: "LOUD",               shortName: "LOUD", region: "CBLOL", seed: 1, logoColor: "#00FF7F" },
];

export const GROUPS: Group[] = [
  {
    id: "groupA",
    name: "Group A",
    ubm1: ["blg", "bfx"],  // UB Match 1
    ubm2: ["g2",  "tsw"],  // UB Match 2
  },
  {
    id: "groupB",
    name: "Group B",
    ubm1: ["geng", "jdg"], // UB Match 1
    ubm2: ["lyon", "loud"],// UB Match 2
  },
];

export const REGION_COLORS: Record<Region, string> = {
  LCK:   "#C8AA6E",
  LPL:   "#E84057",
  LEC:   "#00C050",
  LCS:   "#0080FF",
  LCP:   "#A855F7",
  CBLOL: "#00FF7F",
};

export const getTeamById = (id: string): Team | undefined =>
  TEAMS.find((t) => t.id === id);
