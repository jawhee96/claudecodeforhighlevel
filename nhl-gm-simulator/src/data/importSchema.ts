import type { Contract, Player, Team } from '@/types';

/**
 * Import pipeline shapes. Users can supply a real, authorized July 20 2026
 * snapshot as JSON matching this envelope. Fields are intentionally permissive;
 * validateDatabase() reports problems rather than the importer silently
 * inventing values. Nothing here bundles copyrighted data.
 */
export interface ImportEnvelope {
  meta: {
    snapshotDate: string;
    sources: string[];
    notes?: string;
  };
  teams?: Partial<Team>[];
  players?: Partial<Player>[];
  contracts?: Partial<Contract>[];
}

export interface ImportResult {
  players: Player[];
  contracts: Contract[];
  teamsOverridden: number;
  applied: number;
  skipped: number;
  warnings: string[];
}

/**
 * Merge an import envelope onto an existing base database. Existing records are
 * matched by id and shallow-merged; unknown records are appended. Imported
 * fields are flagged 'user-edited' unless the envelope declares otherwise.
 */
export function applyImport(
  base: { players: Player[]; contracts: Contract[]; teams: Team[] },
  env: ImportEnvelope,
): ImportResult {
  const warnings: string[] = [];
  const players = base.players.slice();
  const contracts = base.contracts.slice();
  const playerIndex = new Map(players.map((p, i) => [p.id, i]));
  const contractIndex = new Map(contracts.map((c, i) => [c.id, i]));

  let applied = 0;
  let skipped = 0;

  for (const partial of env.players ?? []) {
    if (!partial.id) {
      warnings.push('Player entry skipped: missing id');
      skipped++;
      continue;
    }
    const idx = playerIndex.get(partial.id);
    if (idx === undefined) {
      warnings.push(`Player ${partial.id} not in base database — appended as new`);
      players.push({ ...(partial as Player), dataStatus: partial.dataStatus ?? 'user-edited' });
      playerIndex.set(partial.id, players.length - 1);
    } else {
      players[idx] = { ...players[idx], ...partial, dataStatus: partial.dataStatus ?? 'user-edited' };
    }
    applied++;
  }

  for (const partial of env.contracts ?? []) {
    if (!partial.id) {
      warnings.push('Contract entry skipped: missing id');
      skipped++;
      continue;
    }
    const idx = contractIndex.get(partial.id);
    if (idx === undefined) {
      contracts.push({ ...(partial as Contract), dataStatus: partial.dataStatus ?? 'user-edited' });
      contractIndex.set(partial.id, contracts.length - 1);
    } else {
      contracts[idx] = { ...contracts[idx], ...partial, dataStatus: partial.dataStatus ?? 'user-edited' };
    }
    applied++;
  }

  const teamsOverridden = env.teams?.length ?? 0;

  return { players, contracts, teamsOverridden, applied, skipped, warnings };
}

/** A tiny sample import file users can copy. */
export const SAMPLE_IMPORT: ImportEnvelope = {
  meta: {
    snapshotDate: '2026-07-20',
    sources: ['user-supplied'],
    notes: 'Sample override — replace ids/values with real authorized data.',
  },
  players: [
    {
      id: 'P00001',
      overall: 91,
      potential: 93,
      dataStatus: 'user-edited',
    },
  ],
  contracts: [
    {
      id: 'C_P00001',
      aav: 12_600_000,
      dataStatus: 'user-edited',
    },
  ],
};
