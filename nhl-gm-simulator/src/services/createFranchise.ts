import type { Franchise, GMProfile, InboxMessage, LineConfig } from '@/types';
import { SCHEMA_VERSION } from '@/data/leagueRules';
import { generateSeedDatabase } from '@/data/seed';
import { generateSchedule } from '@/engine/schedule';
import { initStandings } from '@/engine/standings';
import { autoLines } from '@/engine/lines';

export interface NewFranchiseOptions {
  name: string;
  userTeamId: string;
  gm: GMProfile;
  seed?: number | string;
}

const SNAPSHOT_DATE = '2026-07-20';
const SEASON_START_YEAR = 2026;
const START_DATE = '2026-10-08';

/** Assemble a complete, self-contained franchise ready to play. */
export function createFranchise(opts: NewFranchiseOptions): Franchise {
  const seed = opts.seed ?? `${opts.userTeamId}-${Date.now()}`;
  const { teams, players, contracts } = generateSeedDatabase(seed, SEASON_START_YEAR);
  const schedule = generateSchedule(teams, SEASON_START_YEAR, seed);
  const standings = initStandings(teams);

  const lines: Record<string, LineConfig> = {};
  for (const team of teams) {
    lines[team.id] = autoLines(team.id, players);
  }

  const now = new Date().toISOString();
  const id = `F_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

  const welcome: InboxMessage = {
    id: 'M_welcome',
    date: START_DATE,
    category: 'Owner',
    priority: 'high',
    sender: 'Team Ownership',
    subject: `Welcome aboard, ${opts.gm.name}`,
    body: `Welcome to the organization. The board has confidence in your ${opts.gm.philosophy.toLowerCase()} approach. Training camp is complete and opening night is here. Set your lines, manage the cap, and get us into the playoff picture. We'll check in monthly.`,
    read: false,
    archived: false,
    relatedTeamId: opts.userTeamId,
  };

  const dbNote: InboxMessage = {
    id: 'M_dbnote',
    date: START_DATE,
    category: 'League',
    priority: 'normal',
    sender: 'Hockey Operations',
    subject: 'Database status — estimated data in use',
    body: 'This franchise uses a fictional, procedurally generated league (all ratings and contracts are ESTIMATED and clearly flagged). Real team names, divisions and conferences are used. Import an authorized July 20, 2026 snapshot from the Database screen to replace estimated values with real data.',
    read: false,
    archived: false,
  };

  return {
    id,
    name: opts.name,
    createdAt: now,
    updatedAt: now,
    schemaVersion: SCHEMA_VERSION,
    gm: opts.gm,
    userTeamId: opts.userTeamId,
    currentDate: START_DATE,
    seasonStartYear: SEASON_START_YEAR,
    teams,
    players,
    contracts,
    schedule,
    standings,
    lines,
    inbox: [welcome, dbNote],
    ownerConfidence: 65,
    fanSatisfaction: 60,
    teamMorale: 68,
    rngState: 1,
    snapshot: {
      snapshotDate: SNAPSHOT_DATE,
      lastRosterUpdate: SNAPSHOT_DATE,
      lastContractUpdate: SNAPSHOT_DATE,
      lastTransactionUpdate: SNAPSHOT_DATE,
      sources: ['Procedurally generated (estimated)', 'Real team/division structure (public)'],
      notes: 'Estimated ratings and contracts. Import authorized data to replace.',
    },
  };
}
