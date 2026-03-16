// Known match schedule for First Stand 2026 (UTC)
// Source: https://lolesports.com/en-GB/tournament/115570858980956868

export interface ScheduledMatch {
  groupId: string;
  bracketMatchId: string;
  startTime: string; // ISO 8601 UTC
  team1Id?: string;
  team2Id?: string;
  label: string;
}

export const SCHEDULE: ScheduledMatch[] = [
  // ── Group A ──────────────────────────────────────────────────
  { groupId: "groupA", bracketMatchId: "ubm1", startTime: "2026-03-16T13:00:00Z", team1Id: "blg",  team2Id: "bfx",  label: "Group A · UB Match 1" },
  { groupId: "groupA", bracketMatchId: "ubm2", startTime: "2026-03-16T18:00:00Z", team1Id: "g2",   team2Id: "tsw",  label: "Group A · UB Match 2" },
  { groupId: "groupA", bracketMatchId: "ubf",  startTime: "2026-03-18T13:00:00Z",                   label: "Group A · UB Final" },
  { groupId: "groupA", bracketMatchId: "lbr1", startTime: "2026-03-19T13:00:00Z",                   label: "Group A · LB Round 1" },
  { groupId: "groupA", bracketMatchId: "lbf",  startTime: "2026-03-20T13:00:00Z",                   label: "Group A · LB Final" },
  // ── Group B ──────────────────────────────────────────────────
  { groupId: "groupB", bracketMatchId: "ubm1", startTime: "2026-03-17T13:00:00Z", team1Id: "geng", team2Id: "jdg",  label: "Group B · UB Match 1" },
  { groupId: "groupB", bracketMatchId: "ubm2", startTime: "2026-03-17T18:00:00Z", team1Id: "lyon", team2Id: "loud", label: "Group B · UB Match 2" },
  { groupId: "groupB", bracketMatchId: "ubf",  startTime: "2026-03-18T18:00:00Z",                   label: "Group B · UB Final" },
  { groupId: "groupB", bracketMatchId: "lbr1", startTime: "2026-03-19T18:00:00Z",                   label: "Group B · LB Round 1" },
  { groupId: "groupB", bracketMatchId: "lbf",  startTime: "2026-03-20T18:00:00Z",                   label: "Group B · LB Final" },
  // ── Playoffs ─────────────────────────────────────────────────
  { groupId: "playoffs", bracketMatchId: "sf1",   startTime: "2026-03-21T13:00:00Z", label: "Semifinals · SF1" },
  { groupId: "playoffs", bracketMatchId: "sf2",   startTime: "2026-03-21T18:00:00Z", label: "Semifinals · SF2" },
  { groupId: "playoffs", bracketMatchId: "final", startTime: "2026-03-22T13:00:00Z", label: "Grand Final" },
];

export function getSchedule(groupId: string, bracketMatchId: string): ScheduledMatch | undefined {
  return SCHEDULE.find(s => s.groupId === groupId && s.bracketMatchId === bracketMatchId);
}

export function matchStatus(startTime: string): "completed" | "live" | "upcoming" {
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const elapsed = now - start;
  if (elapsed < 0) return "upcoming";
  if (elapsed < 6 * 60 * 60 * 1000) return "live"; // within 6h of start = possibly live
  return "completed";
}

export function formatMatchTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZoneName: "short",
    timeZone: "UTC",
  });
}
