import type {
  Contract,
  Player,
  ScheduledGame,
  Team,
  ValidationIssue,
  ValidationReport,
} from '@/types';

export interface ValidationInput {
  teams: Team[];
  players: Player[];
  contracts: Contract[];
  schedule?: ScheduledGame[];
}

const VALID_POSITIONS = new Set(['C', 'LW', 'RW', 'LD', 'RD', 'G']);

/**
 * Comprehensive import validation. Detects duplicates, orphaned references,
 * impossible values, and tallies estimated/missing fields for the honest
 * database status screen.
 */
export function validateDatabase(input: ValidationInput): ValidationReport {
  const { teams, players, contracts, schedule = [] } = input;
  const issues: ValidationIssue[] = [];
  const teamIds = new Set(teams.map((t) => t.id));
  const contractById = new Map(contracts.map((c) => [c.id, c]));

  let estimatedFields = 0;
  let missingFields = 0;

  // Duplicate player ids.
  const seenPlayers = new Set<string>();
  for (const p of players) {
    if (seenPlayers.has(p.id)) {
      issues.push({ severity: 'error', code: 'DUP_PLAYER', message: `Duplicate player id ${p.id}`, entityId: p.id });
    }
    seenPlayers.add(p.id);

    if (!p.birthDate) {
      issues.push({ severity: 'warning', code: 'MISSING_BIRTHDATE', message: `${p.fullName} missing birth date`, entityId: p.id });
      missingFields++;
    }
    if (!VALID_POSITIONS.has(p.position)) {
      issues.push({ severity: 'error', code: 'BAD_POSITION', message: `${p.fullName} invalid position "${p.position}"`, entityId: p.id });
    }
    if (p.currentTeamId && !teamIds.has(p.currentTeamId)) {
      issues.push({ severity: 'error', code: 'UNKNOWN_TEAM', message: `${p.fullName} references unknown team ${p.currentTeamId}`, entityId: p.id });
    }
    if (p.overall < 1 || p.overall > 100) {
      issues.push({ severity: 'error', code: 'BAD_OVERALL', message: `${p.fullName} overall out of range (${p.overall})`, entityId: p.id });
    }
    if (p.contractId && !contractById.has(p.contractId)) {
      issues.push({ severity: 'warning', code: 'MISSING_CONTRACT', message: `${p.fullName} references missing contract ${p.contractId}`, entityId: p.id });
      missingFields++;
    }
    if (p.dataStatus === 'estimated') estimatedFields++;
    if (p.dataStatus === 'missing') missingFields++;
  }

  // Contracts.
  const seenContracts = new Set<string>();
  for (const c of contracts) {
    if (seenContracts.has(c.id)) {
      issues.push({ severity: 'error', code: 'DUP_CONTRACT', message: `Duplicate contract id ${c.id}`, entityId: c.id });
    }
    seenContracts.add(c.id);
    if (c.aav < 0) {
      issues.push({ severity: 'error', code: 'NEG_CAP', message: `Contract ${c.id} has negative AAV`, entityId: c.id });
    }
    if (c.aav > 20_000_000) {
      issues.push({ severity: 'warning', code: 'HIGH_CAP', message: `Contract ${c.id} AAV ${c.aav} unusually high`, entityId: c.id });
    }
    if (c.endSeason < c.startSeason) {
      issues.push({ severity: 'error', code: 'BAD_TERM', message: `Contract ${c.id} ends before it starts`, entityId: c.id });
    }
    if (c.dataStatus === 'estimated') estimatedFields++;
  }

  // Players on multiple teams (currentTeamId is single, so check name+team collisions cheaply skipped).
  // Team roster limits (soft warning).
  const rosterCount = new Map<string, number>();
  for (const p of players) {
    if (p.currentTeamId) rosterCount.set(p.currentTeamId, (rosterCount.get(p.currentTeamId) ?? 0) + 1);
  }
  for (const [teamId, count] of rosterCount) {
    if (count > 60) {
      issues.push({ severity: 'warning', code: 'BIG_ROSTER', message: `Team ${teamId} has ${count} players (over reserve list)`, entityId: teamId });
    }
    if (count < 20) {
      issues.push({ severity: 'warning', code: 'THIN_ROSTER', message: `Team ${teamId} has only ${count} players`, entityId: teamId });
    }
  }

  // Schedule sanity.
  for (const g of schedule) {
    if (g.homeTeamId === g.awayTeamId) {
      issues.push({ severity: 'error', code: 'SELF_GAME', message: `Game ${g.id} has a team playing itself`, entityId: g.id });
    }
    if (!teamIds.has(g.homeTeamId) || !teamIds.has(g.awayTeamId)) {
      issues.push({ severity: 'error', code: 'GAME_UNKNOWN_TEAM', message: `Game ${g.id} references unknown team`, entityId: g.id });
    }
  }

  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;

  return {
    generatedAt: new Date().toISOString(),
    issues,
    counts: {
      teams: teams.length,
      players: players.length,
      contracts: contracts.length,
      scheduledGames: schedule.length,
      estimatedFields,
      missingFields,
      errors,
      warnings,
    },
  };
}
