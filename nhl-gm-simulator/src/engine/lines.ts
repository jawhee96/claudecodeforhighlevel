import type { LineConfig, Player } from '@/types';
import { isGoalie } from '@/types';

/** Auto-generate a sensible depth chart from a team's roster. */
export function autoLines(teamId: string, players: Player[]): LineConfig {
  const roster = players.filter((p) => p.currentTeamId === teamId && p.rosterStatus === 'ACTIVE');
  const forwards = roster.filter((p) => ['C', 'LW', 'RW'].includes(p.position)).sort((a, b) => b.overall - a.overall);
  const defense = roster.filter((p) => ['LD', 'RD'].includes(p.position)).sort((a, b) => b.overall - a.overall);
  const goalies = roster.filter(isGoalie).sort((a, b) => b.overall - a.overall);

  const forwardLines: LineConfig['forwardLines'] = [];
  for (let i = 0; i < 4; i++) {
    const line = forwards.slice(i * 3, i * 3 + 3);
    forwardLines.push([line[0]?.id ?? null, line[1]?.id ?? null, line[2]?.id ?? null]);
  }
  const defensePairs: LineConfig['defensePairs'] = [];
  for (let i = 0; i < 3; i++) {
    const pair = defense.slice(i * 2, i * 2 + 2);
    defensePairs.push([pair[0]?.id ?? null, pair[1]?.id ?? null]);
  }

  return {
    forwardLines,
    defensePairs,
    starter: goalies[0]?.id ?? null,
    backup: goalies[1]?.id ?? null,
    powerPlay1: [...forwards.slice(0, 3), ...defense.slice(0, 2)].map((p) => p.id),
    penaltyKill1: [...forwards.slice(0, 2).map((p) => p.id), ...defense.slice(0, 2).map((p) => p.id)],
  };
}

/** Chemistry heuristic: handedness balance + closeness in skill on a pairing. */
export function lineChemistry(playerIds: (string | null)[], players: Player[]): number {
  const byId = new Map(players.map((p) => [p.id, p]));
  const present = playerIds.map((id) => (id ? byId.get(id) : undefined)).filter((p): p is Player => !!p);
  if (present.length < 2) return 50;
  const avgOverall = present.reduce((s, p) => s + p.overall, 0) / present.length;
  const variance = present.reduce((s, p) => s + Math.abs(p.overall - avgOverall), 0) / present.length;
  const morale = present.reduce((s, p) => s + p.morale, 0) / present.length;
  const chem = 60 + (morale - 70) * 0.4 - variance * 1.2;
  return Math.max(20, Math.min(99, Math.round(chem)));
}
