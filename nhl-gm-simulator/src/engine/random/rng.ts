/**
 * Deterministic, seedable PRNG (mulberry32) plus a small helper wrapper.
 * Given the same seed and the same call sequence, results are identical —
 * this is the backbone of reproducible simulation.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let tImm = Math.imul(a ^ (a >>> 15), 1 | a);
    tImm = (tImm + Math.imul(tImm ^ (tImm >>> 7), 61 | tImm)) ^ tImm;
    return ((tImm ^ (tImm >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash arbitrary strings into a 32-bit seed (xmur3 style). */
export function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

export class Rng {
  private next: () => number;
  readonly seed: number;

  constructor(seed: number | string) {
    this.seed = typeof seed === 'string' ? hashSeed(seed) : seed >>> 0;
    this.next = mulberry32(this.seed);
  }

  /** float in [0, 1) */
  float(): number {
    return this.next();
  }

  /** integer in [min, max] inclusive */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** float in [min, max) */
  range(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /** true with probability p */
  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Approx. normal via central limit (mean, stdev). */
  normal(mean: number, stdev: number): number {
    let sum = 0;
    for (let i = 0; i < 6; i++) sum += this.next();
    return mean + (sum - 3) * (stdev / Math.sqrt(0.5));
  }

  /** Poisson sample (Knuth) for goal/shot counts. */
  poisson(lambda: number): number {
    const l = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= this.next();
    } while (p > l);
    return k - 1;
  }

  shuffle<T>(arr: T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
