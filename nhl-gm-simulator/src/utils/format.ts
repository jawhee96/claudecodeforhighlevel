import type { GoalieStatLine, Player, SkaterStatLine } from '@/types';
import { isGoalie } from '@/types';

export function toi(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function savePct(g: GoalieStatLine): string {
  if (g.shotsAgainst === 0) return '—';
  return (g.saves / g.shotsAgainst).toFixed(3).replace(/^0/, '');
}

export function gaa(g: GoalieStatLine): string {
  if (g.toiSeconds === 0) return '—';
  return ((g.goalsAgainst * 3600) / g.toiSeconds).toFixed(2);
}

export function isSkaterStats(p: Player): p is Player & { regularSeasonStats: SkaterStatLine } {
  return !isGoalie(p);
}

export function statusTone(status: Player['dataStatus']): string {
  switch (status) {
    case 'verified':
      return 'bg-ice-good/15 text-ice-good';
    case 'estimated':
      return 'bg-ice-warn/15 text-ice-warn';
    case 'user-edited':
      return 'bg-ice-accent/15 text-ice-accent';
    case 'missing':
      return 'bg-ice-bad/15 text-ice-bad';
    default:
      return 'bg-ice-muted/15 text-ice-muted';
  }
}
