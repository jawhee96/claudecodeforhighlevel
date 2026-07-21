import { describe, it, expect } from 'vitest';
import { applyResultToStandings, compareStandings, emptyStanding, sortStandings, computePlayoffPicture } from '@/engine/standings';
import type { ScheduledGame, TeamStanding } from '@/types';
import { NHL_TEAMS } from '@/data/teams';

function game(home: string, away: string, hg: number, ag: number, endedIn: 'REG' | 'OT' | 'SO'): ScheduledGame {
  const winner = hg > ag ? home : away;
  const loser = hg > ag ? away : home;
  return {
    id: `${home}-${away}`, date: '2026-10-10', homeTeamId: home, awayTeamId: away, played: true,
    result: {
      homeGoals: hg, awayGoals: ag, homeShots: 30, awayShots: 28, endedIn,
      winnerTeamId: winner, loserTeamId: loser, stars: [], homeSkaters: [], awaySkaters: [],
      homeGoalieId: null, awayGoalieId: null, seed: 1, recap: '',
    },
  };
}

describe('standings', () => {
  it('awards 2 points for a win and 1 for an OT loss', () => {
    const standings = [emptyStanding('BOS'), emptyStanding('TOR')];
    applyResultToStandings(standings, game('BOS', 'TOR', 3, 2, 'OT'));
    const bos = standings.find((s) => s.teamId === 'BOS')!;
    const tor = standings.find((s) => s.teamId === 'TOR')!;
    expect(bos.points).toBe(2);
    expect(bos.wins).toBe(1);
    expect(tor.points).toBe(1);
    expect(tor.otLosses).toBe(1);
    expect(tor.regulationLosses).toBe(0);
  });

  it('awards 0 points for a regulation loss', () => {
    const standings = [emptyStanding('BOS'), emptyStanding('TOR')];
    applyResultToStandings(standings, game('BOS', 'TOR', 1, 4, 'REG'));
    const bos = standings.find((s) => s.teamId === 'BOS')!;
    expect(bos.points).toBe(0);
    expect(bos.regulationLosses).toBe(1);
  });

  it('sorts by points then regulation wins', () => {
    const a: TeamStanding = { ...emptyStanding('A'), points: 50, regulationWins: 20 };
    const b: TeamStanding = { ...emptyStanding('B'), points: 50, regulationWins: 25 };
    const c: TeamStanding = { ...emptyStanding('C'), points: 60, regulationWins: 5 };
    const sorted = sortStandings([a, b, c]);
    expect(sorted.map((s) => s.teamId)).toEqual(['C', 'B', 'A']);
  });

  it('breaks ties by goal differential', () => {
    const a: TeamStanding = { ...emptyStanding('A'), points: 50, regulationWins: 20, wins: 24, goalsFor: 100, goalsAgainst: 80 };
    const b: TeamStanding = { ...emptyStanding('B'), points: 50, regulationWins: 20, wins: 24, goalsFor: 100, goalsAgainst: 90 };
    expect(compareStandings(a, b)).toBeLessThan(0); // a ranks ahead
  });

  it('produces a playoff picture with 3 leaders per division and 2 wildcards per conference', () => {
    const standings = NHL_TEAMS.map((t, i) => ({ ...emptyStanding(t.id), points: 100 - i }));
    const picture = computePlayoffPicture(standings, NHL_TEAMS);
    expect(picture.divisionLeaders.Atlantic).toHaveLength(3);
    expect(picture.wildcards.Eastern).toHaveLength(2);
    expect(picture.wildcards.Western).toHaveLength(2);
  });
});
