import { describe, it, expect } from 'vitest';
import { simulateGame } from '@/engine/gameSim';
import { generateSeedDatabase } from '@/data/seed';
import { TEAM_BY_ID } from '@/data/teams';

describe('game simulation', () => {
  const { players } = generateSeedDatabase('test-seed', 2026);
  const home = TEAM_BY_ID.BOS;
  const away = TEAM_BY_ID.TOR;

  it('is reproducible for the same seed and inputs', () => {
    const a = simulateGame({ homeTeam: home, awayTeam: away, players, seed: 'game-1' });
    const b = simulateGame({ homeTeam: home, awayTeam: away, players, seed: 'game-1' });
    expect(a).toEqual(b);
  });

  it('produces a decisive result (no ties)', () => {
    for (let i = 0; i < 50; i++) {
      const r = simulateGame({ homeTeam: home, awayTeam: away, players, seed: `g${i}` });
      expect(r.homeGoals).not.toBe(r.awayGoals);
      expect(r.winnerTeamId === home.id || r.winnerTeamId === away.id).toBe(true);
    }
  });

  it('records the winning goal margin consistently', () => {
    const r = simulateGame({ homeTeam: home, awayTeam: away, players, seed: 'margin' });
    const winnerGoals = r.winnerTeamId === home.id ? r.homeGoals : r.awayGoals;
    const loserGoals = r.winnerTeamId === home.id ? r.awayGoals : r.homeGoals;
    expect(winnerGoals).toBeGreaterThan(loserGoals);
  });

  it('names up to three stars', () => {
    const r = simulateGame({ homeTeam: home, awayTeam: away, players, seed: 'stars' });
    expect(r.stars.length).toBeLessThanOrEqual(3);
  });

  it('assigns shots to both teams', () => {
    const r = simulateGame({ homeTeam: home, awayTeam: away, players, seed: 'shots' });
    expect(r.homeShots).toBeGreaterThan(10);
    expect(r.awayShots).toBeGreaterThan(10);
  });
});
