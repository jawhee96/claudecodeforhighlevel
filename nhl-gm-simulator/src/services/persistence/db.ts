import Dexie, { type Table } from 'dexie';
import type { Franchise, FranchiseSummary } from '@/types';

/**
 * IndexedDB persistence via Dexie. A whole franchise is stored as one row
 * (self-contained snapshot). This keeps saves atomic and reload-identical.
 * Schema is versioned so migrations can be added without data loss.
 */
export class GmDatabase extends Dexie {
  franchises!: Table<Franchise, string>;

  constructor() {
    super('nhl-gm-simulator');
    this.version(1).stores({
      // Only index the fields we query on; the full object is stored regardless.
      franchises: 'id, name, userTeamId, updatedAt',
    });
  }
}

export const db = new GmDatabase();

export async function saveFranchise(f: Franchise): Promise<void> {
  f.updatedAt = new Date().toISOString();
  await db.franchises.put(f);
}

export async function loadFranchise(id: string): Promise<Franchise | undefined> {
  return db.franchises.get(id);
}

export async function deleteFranchise(id: string): Promise<void> {
  await db.franchises.delete(id);
}

export async function duplicateFranchise(id: string): Promise<Franchise | undefined> {
  const original = await db.franchises.get(id);
  if (!original) return undefined;
  const copy: Franchise = {
    ...structuredClone(original),
    id: `F_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name: `${original.name} (copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await db.franchises.put(copy);
  return copy;
}

export async function listFranchises(): Promise<FranchiseSummary[]> {
  const all = await db.franchises.orderBy('updatedAt').reverse().toArray();
  return all.map((f) => ({
    id: f.id,
    name: f.name,
    userTeamAbbrev: f.teams.find((t) => t.id === f.userTeamId)?.abbrev ?? '???',
    currentDate: f.currentDate,
    updatedAt: f.updatedAt,
  }));
}

export function exportFranchiseJson(f: Franchise): string {
  return JSON.stringify(f, null, 2);
}

export async function importFranchiseJson(json: string): Promise<Franchise> {
  const parsed = JSON.parse(json) as Franchise;
  if (!parsed.id || !parsed.teams || !parsed.players) {
    throw new Error('Invalid franchise file: missing required fields.');
  }
  // Give a fresh id to avoid clobbering an existing save.
  parsed.id = `F_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  parsed.updatedAt = new Date().toISOString();
  await db.franchises.put(parsed);
  return parsed;
}
