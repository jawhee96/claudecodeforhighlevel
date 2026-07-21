import { describe, it, expect } from 'vitest';
import { validateDatabase } from '@/data/validation';
import { generateSeedDatabase } from '@/data/seed';
import { generateSchedule } from '@/engine/schedule';

describe('database validation', () => {
  it('reports no blocking errors for a freshly generated database', () => {
    const { teams, players, contracts } = generateSeedDatabase('valid-seed', 2026);
    const schedule = generateSchedule(teams, 2026, 'valid-seed');
    const report = validateDatabase({ teams, players, contracts, schedule });
    expect(report.counts.errors).toBe(0);
  });

  it('counts estimated fields', () => {
    const { teams, players, contracts } = generateSeedDatabase('valid-seed', 2026);
    const report = validateDatabase({ teams, players, contracts });
    expect(report.counts.estimatedFields).toBeGreaterThan(0);
  });

  it('detects an unknown team reference', () => {
    const { teams, players, contracts } = generateSeedDatabase('valid-seed', 2026);
    players[0].currentTeamId = 'ZZZ';
    const report = validateDatabase({ teams, players, contracts });
    expect(report.issues.some((i) => i.code === 'UNKNOWN_TEAM')).toBe(true);
    expect(report.counts.errors).toBeGreaterThan(0);
  });

  it('detects a contract that ends before it starts', () => {
    const { teams, players, contracts } = generateSeedDatabase('valid-seed', 2026);
    contracts[0].startSeason = 2030;
    contracts[0].endSeason = 2027;
    const report = validateDatabase({ teams, players, contracts });
    expect(report.issues.some((i) => i.code === 'BAD_TERM')).toBe(true);
  });
});
