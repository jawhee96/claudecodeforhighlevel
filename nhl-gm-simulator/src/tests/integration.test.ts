import { describe, it, expect, beforeEach } from 'vitest';
import { createFranchise } from '@/services/createFranchise';
import { simulateOneDay } from '@/engine/sim';
import { saveFranchise, loadFranchise, db } from '@/services/persistence/db';
import type { GMProfile } from '@/types';

const gm: GMProfile = {
  name: 'Test GM', age: 40, nationality: 'CAN', philosophy: 'Balanced',
  tradeAggressiveness: 50, analyticsPreference: 50, playerLoyalty: 50,
};

describe('franchise integration', () => {
  beforeEach(async () => {
    await db.franchises.clear();
  });

  it('creates a franchise with 32 teams and a full league of players', () => {
    const f = createFranchise({ name: 'Test', userTeamId: 'CGY', gm, seed: 'fixed' });
    expect(f.teams).toHaveLength(32);
    expect(f.players.length).toBeGreaterThan(700); // 32 * ~23
    expect(f.schedule.length).toBeGreaterThan(1000);
    expect(f.userTeamId).toBe('CGY');
    expect(Object.keys(f.lines)).toHaveLength(32);
  });

  it('simulates days, records results, and advances the clock', () => {
    const f = createFranchise({ name: 'Test', userTeamId: 'CGY', gm, seed: 'fixed' });
    const startDate = f.currentDate;
    let totalGames = 0;
    for (let i = 0; i < 30; i++) {
      totalGames += simulateOneDay(f).gamesPlayed;
    }
    expect(f.currentDate).not.toBe(startDate);
    expect(totalGames).toBeGreaterThan(0);
    const totalGP = f.standings.reduce((s, st) => s + st.gamesPlayed, 0);
    expect(totalGP).toBe(totalGames * 2);
  });

  it('saves and reloads to an identical state', async () => {
    const f = createFranchise({ name: 'Test', userTeamId: 'CGY', gm, seed: 'fixed' });
    for (let i = 0; i < 20; i++) simulateOneDay(f);
    await saveFranchise(f);

    const reloaded = await loadFranchise(f.id);
    expect(reloaded).toBeDefined();
    expect(reloaded!.currentDate).toBe(f.currentDate);
    expect(reloaded!.standings).toEqual(f.standings);
    expect(reloaded!.rngState).toBe(f.rngState);
    // Deep equality of the whole snapshot.
    expect(JSON.stringify(reloaded)).toBe(JSON.stringify(f));
  });

  it('produces identical simulation from the same seed', () => {
    const a = createFranchise({ name: 'A', userTeamId: 'CGY', gm, seed: 'reproducible' });
    const b = createFranchise({ name: 'B', userTeamId: 'CGY', gm, seed: 'reproducible' });
    for (let i = 0; i < 40; i++) {
      simulateOneDay(a);
      simulateOneDay(b);
    }
    expect(a.standings).toEqual(b.standings);
  });
});
