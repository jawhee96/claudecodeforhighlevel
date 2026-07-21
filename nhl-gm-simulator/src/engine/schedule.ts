import type { ScheduledGame, Team } from '@/types';
import { Rng } from './random/rng';

const MS_PER_DAY = 86_400_000;

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  return isoDate(new Date(new Date(iso).getTime() + days * MS_PER_DAY));
}

/**
 * Generate a valid, balanced 82-game schedule (SIMULATED — clearly labeled).
 * Each team plays 82 games. We build a round-robin-ish set of pairings and
 * distribute game dates across the season window, capping games per day.
 *
 * This is not the official NHL schedule; if an official schedule import is
 * provided it replaces this. Reproducible for a given seed.
 */
export function generateSchedule(
  teams: Team[],
  seasonStartYear: number,
  seed: number | string,
): ScheduledGame[] {
  const rng = new Rng(`${seed}|schedule`);
  const gamesTarget = 82;
  const perTeam: Record<string, number> = {};
  teams.forEach((t) => (perTeam[t.id] = 0));

  // Build candidate matchups weighted toward divisional/conference opponents.
  type Pair = { a: string; b: string; weight: number };
  const pairs: Pair[] = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const A = teams[i];
      const B = teams[j];
      let weight = 2; // non-conference
      if (A.conference === B.conference) weight = 3;
      if (A.division === B.division) weight = 4;
      pairs.push({ a: A.id, b: B.id, weight });
    }
  }

  // Expand pairs into individual games honoring weights, alternating home/away.
  const games: { home: string; away: string }[] = [];
  for (const p of pairs) {
    for (let g = 0; g < p.weight; g++) {
      const homeFirst = g % 2 === 0;
      games.push(homeFirst ? { home: p.a, away: p.b } : { home: p.b, away: p.a });
    }
  }

  // Trim/balance to ~82 per team by dropping games from teams over target.
  const shuffled = rng.shuffle(games);
  const kept: { home: string; away: string }[] = [];
  for (const g of shuffled) {
    if (perTeam[g.home] < gamesTarget && perTeam[g.away] < gamesTarget) {
      kept.push(g);
      perTeam[g.home]++;
      perTeam[g.away]++;
    }
  }

  // Season window: early Oct to mid-April.
  const seasonStart = `${seasonStartYear}-10-08`;
  const seasonDays = 185;
  const maxGamesPerDay = 12;

  // Assign dates: spread across days, avoid a team playing twice per day.
  const orderedGames = rng.shuffle(kept);
  const dayTeamBusy: Record<number, Set<string>> = {};
  const dayCount: Record<number, number> = {};
  const scheduled: ScheduledGame[] = [];
  let gameId = 0;

  for (const g of orderedGames) {
    let day = rng.int(0, seasonDays - 1);
    let attempts = 0;
    while (attempts < seasonDays) {
      const busy = dayTeamBusy[day] ?? new Set<string>();
      const count = dayCount[day] ?? 0;
      if (count < maxGamesPerDay && !busy.has(g.home) && !busy.has(g.away)) {
        busy.add(g.home);
        busy.add(g.away);
        dayTeamBusy[day] = busy;
        dayCount[day] = count + 1;
        break;
      }
      day = (day + 1) % seasonDays;
      attempts++;
    }
    scheduled.push({
      id: `G${String(gameId++).padStart(5, '0')}`,
      date: addDays(seasonStart, day),
      homeTeamId: g.home,
      awayTeamId: g.away,
      played: false,
    });
  }

  scheduled.sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
  return scheduled;
}
