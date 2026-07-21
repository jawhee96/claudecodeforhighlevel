import { describe, it, expect } from 'vitest';
import { generateSchedule } from '@/engine/schedule';
import { NHL_TEAMS } from '@/data/teams';

describe('schedule generation', () => {
  const schedule = generateSchedule(NHL_TEAMS, 2026, 'sched-seed');

  it('gives every team close to 82 games', () => {
    const counts = new Map<string, number>();
    for (const g of schedule) {
      counts.set(g.homeTeamId, (counts.get(g.homeTeamId) ?? 0) + 1);
      counts.set(g.awayTeamId, (counts.get(g.awayTeamId) ?? 0) + 1);
    }
    for (const team of NHL_TEAMS) {
      const c = counts.get(team.id) ?? 0;
      expect(c).toBeGreaterThanOrEqual(78);
      expect(c).toBeLessThanOrEqual(82);
    }
  });

  it('never schedules a team against itself', () => {
    expect(schedule.every((g) => g.homeTeamId !== g.awayTeamId)).toBe(true);
  });

  it('is sorted by date', () => {
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].date >= schedule[i - 1].date).toBe(true);
    }
  });

  it('never has a team playing twice on the same day', () => {
    const byDate = new Map<string, Set<string>>();
    for (const g of schedule) {
      const set = byDate.get(g.date) ?? new Set<string>();
      expect(set.has(g.homeTeamId)).toBe(false);
      expect(set.has(g.awayTeamId)).toBe(false);
      set.add(g.homeTeamId);
      set.add(g.awayTeamId);
      byDate.set(g.date, set);
    }
  });

  it('is deterministic for the same seed', () => {
    const b = generateSchedule(NHL_TEAMS, 2026, 'sched-seed');
    expect(b.length).toBe(schedule.length);
    expect(b[0]).toEqual(schedule[0]);
  });
});
