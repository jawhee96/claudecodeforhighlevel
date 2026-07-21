import { describe, it, expect } from 'vitest';
import { computeCapSummary } from '@/engine/salaryCap';
import type { Contract, Player } from '@/types';
import { emptySkaterStats } from '@/types';
import { LEAGUE_RULES } from '@/data/leagueRules';

function player(id: string, status: Player['rosterStatus'], contractId: string | null): Player {
  return {
    id, firstName: 'Test', lastName: id, fullName: `Test ${id}`, birthDate: '2000-01-01', age: 25,
    nationality: 'CAN', position: 'C', shootsCatches: 'L', currentTeamId: 'BOS', leagueLevel: 'NHL',
    rosterStatus: status, overall: 80, potential: 82, potentialLow: 80, potentialHigh: 84,
    archetype: 'Sniper', scoutingConfidence: 90, contractId, morale: 70, durability: 75, leadership: 50,
    injury: null, regularSeasonStats: emptySkaterStats(), dataStatus: 'estimated',
  };
}

function contract(id: string, aav: number): Contract {
  return {
    id, playerId: id.replace('C_', ''), type: 'one-way', aav, totalValue: aav * 2,
    startSeason: 2026, endSeason: 2027,
    years: [{ season: 2026, capHit: aav, salary: aav, signingBonus: 0 }],
    noTradeClause: false, noMovementClause: false, signingBonusTotal: 0, dataStatus: 'estimated',
  };
}

describe('computeCapSummary', () => {
  it('sums active cap hits only for cap-counting statuses', () => {
    const players = [
      player('p1', 'ACTIVE', 'C_p1'),
      player('p2', 'ACTIVE', 'C_p2'),
      player('p3', 'MINORS', 'C_p3'), // buried in minors: not counted
    ];
    const contracts = [contract('C_p1', 5_000_000), contract('C_p2', 3_000_000), contract('C_p3', 900_000)];
    const cap = computeCapSummary('BOS', players, contracts, 2026);
    expect(cap.activeCapHit).toBe(8_000_000);
    expect(cap.capSpace).toBe(LEAGUE_RULES.salaryCapUpperLimit - 8_000_000);
    expect(cap.contractCount).toBe(3);
    expect(cap.activeRosterCount).toBe(2);
  });

  it('flags over-cap situations', () => {
    const players = Array.from({ length: 3 }, (_, i) => player(`p${i}`, 'ACTIVE', `C_p${i}`));
    const contracts = players.map((p) => contract(`C_${p.id}`, 40_000_000));
    const cap = computeCapSummary('BOS', players, contracts, 2026);
    expect(cap.overCap).toBe(true);
    expect(cap.rosterValid).toBe(false);
    expect(cap.messages.some((m) => m.includes('Over the cap'))).toBe(true);
  });

  it('ignores contracts outside the current season window', () => {
    const players = [player('p1', 'ACTIVE', 'C_p1')];
    const c = contract('C_p1', 5_000_000);
    c.startSeason = 2028;
    c.endSeason = 2030;
    const cap = computeCapSummary('BOS', players, [c], 2026);
    expect(cap.activeCapHit).toBe(0);
  });
});
