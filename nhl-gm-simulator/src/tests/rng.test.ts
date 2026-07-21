import { describe, it, expect } from 'vitest';
import { Rng, hashSeed } from '@/engine/random/rng';

describe('Rng', () => {
  it('is deterministic for the same seed', () => {
    const a = new Rng('seed-123');
    const b = new Rng('seed-123');
    const seqA = Array.from({ length: 20 }, () => a.float());
    const seqB = Array.from({ length: 20 }, () => b.float());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = Array.from({ length: 10 }, (_, i) => new Rng(i).float());
    const unique = new Set(a);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('int() stays within bounds', () => {
    const rng = new Rng(42);
    for (let i = 0; i < 1000; i++) {
      const n = rng.int(3, 7);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(7);
    }
  });

  it('hashSeed is stable', () => {
    expect(hashSeed('abc')).toBe(hashSeed('abc'));
    expect(hashSeed('abc')).not.toBe(hashSeed('abd'));
  });
});
