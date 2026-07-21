/**
 * Core domain types for the NHL GM Simulator.
 *
 * These are intentionally conservative for the Phase 1 vertical slice but the
 * shapes are designed to expand (scouting, morale, owners, media, history)
 * without breaking existing saves. Every persisted record carries a
 * `dataStatus` so the UI can honestly show what is verified vs estimated.
 */

export type DataStatus = 'verified' | 'estimated' | 'unverified' | 'missing' | 'user-edited';

export type Conference = 'Eastern' | 'Western';
export type Division = 'Atlantic' | 'Metropolitan' | 'Central' | 'Pacific';

export type Position = 'C' | 'LW' | 'RW' | 'LD' | 'RD' | 'G';
export type SkaterPosition = Exclude<Position, 'G'>;
export type Handedness = 'L' | 'R';

export type LeagueLevel = 'NHL' | 'AHL' | 'ECHL' | 'CHL' | 'NCAA' | 'USHL' | 'EUROPE' | 'KHL' | 'OTHER';

export type RosterStatus =
  | 'ACTIVE'
  | 'SCRATCHED'
  | 'MINORS'
  | 'RESERVE'
  | 'IR'
  | 'LTIR'
  | 'LOANED'
  | 'UNSIGNED';

export type ForwardArchetype =
  | 'Sniper'
  | 'Playmaker'
  | 'Power Forward'
  | 'Two-Way Forward'
  | 'Defensive Forward'
  | 'Grinder'
  | 'Energy Forward'
  | 'Net-Front Scorer'
  | 'Transition Forward';

export type DefenceArchetype =
  | 'Offensive Defenceman'
  | 'Puck-Moving Defenceman'
  | 'Two-Way Defenceman'
  | 'Defensive Defenceman'
  | 'Shutdown Defenceman'
  | 'Physical Defenceman';

export type GoalieArchetype = 'Butterfly' | 'Hybrid' | 'Athletic' | 'Positional' | 'Puck-Playing';

export type PlayerArchetype = ForwardArchetype | DefenceArchetype | GoalieArchetype;

export interface Team {
  id: string;
  abbrev: string;
  name: string;
  city: string;
  conference: Conference;
  division: Division;
  /** Optional user-supplied logo URL — never bundled. */
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  /** 2025-26 final record used for team-select cards. */
  lastSeasonRecord: { wins: number; losses: number; otLosses: number };
  arena: string;
  dataStatus: DataStatus;
}

/** Skater on-ice ratings (1-100 internal). */
export interface SkaterRatings {
  speed: number;
  shooting: number;
  passing: number;
  puckControl: number;
  offensiveIQ: number;
  defensiveIQ: number;
  physicality: number;
  faceoffs: number;
  discipline: number;
  hockeyIQ: number;
}

export interface GoalieRatings {
  reflexes: number;
  positioning: number;
  reboundControl: number;
  lateralMovement: number;
  puckHandling: number;
  composure: number;
  consistency: number;
}

export interface ContractYear {
  season: number; // starting year, e.g. 2026 for 2026-27
  capHit: number; // AAV in dollars
  salary: number;
  signingBonus: number;
}

export type ContractType = 'one-way' | 'two-way' | 'entry-level';

export interface Contract {
  id: string;
  playerId: string;
  type: ContractType;
  aav: number; // average annual value / cap hit
  totalValue: number;
  startSeason: number;
  endSeason: number; // inclusive final season
  years: ContractYear[];
  noTradeClause: boolean;
  noMovementClause: boolean;
  signingBonusTotal: number;
  dataStatus: DataStatus;
}

export interface SkaterStatLine {
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  shots: number;
  hits: number;
  blocks: number;
  pim: number;
  toiSeconds: number;
}

export interface GoalieStatLine {
  gamesPlayed: number;
  wins: number;
  losses: number;
  otLosses: number;
  shotsAgainst: number;
  saves: number;
  goalsAgainst: number;
  shutouts: number;
  toiSeconds: number;
}

export function emptySkaterStats(): SkaterStatLine {
  return {
    gamesPlayed: 0,
    goals: 0,
    assists: 0,
    points: 0,
    plusMinus: 0,
    shots: 0,
    hits: 0,
    blocks: 0,
    pim: 0,
    toiSeconds: 0,
  };
}

export function emptyGoalieStats(): GoalieStatLine {
  return {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    otLosses: 0,
    shotsAgainst: 0,
    saves: 0,
    goalsAgainst: 0,
    shutouts: 0,
    toiSeconds: 0,
  };
}

export interface Injury {
  type: string;
  severity: 'minor' | 'moderate' | 'major';
  gamesRemaining: number;
}

export interface Player {
  id: string;
  nhlId?: number;
  firstName: string;
  lastName: string;
  fullName: string;
  birthDate: string; // ISO
  age: number;
  nationality: string;

  position: Position;
  shootsCatches: Handedness;

  currentTeamId: string | null;
  leagueLevel: LeagueLevel;
  rosterStatus: RosterStatus;

  overall: number; // 1-100 true rating
  potential: number; // 1-100 ceiling
  potentialLow: number;
  potentialHigh: number;

  archetype: PlayerArchetype;

  skaterRatings?: SkaterRatings;
  goalieRatings?: GoalieRatings;

  /** Scouting confidence 0-100: how well the true ratings are known. */
  scoutingConfidence: number;

  contractId: string | null;

  morale: number; // 0-100
  durability: number; // 0-100
  leadership: number; // 0-100

  injury: Injury | null;

  regularSeasonStats: SkaterStatLine | GoalieStatLine;

  dataStatus: DataStatus;
}

export function isGoalie(p: Player): boolean {
  return p.position === 'G';
}

export interface ScheduledGame {
  id: string;
  date: string; // ISO date (no time)
  homeTeamId: string;
  awayTeamId: string;
  played: boolean;
  result?: GameResult;
}

export interface GamePlayerStat {
  playerId: string;
  goals: number;
  assists: number;
  shots: number;
  toiSeconds: number;
}

export interface GameResult {
  homeGoals: number;
  awayGoals: number;
  homeShots: number;
  awayShots: number;
  endedIn: 'REG' | 'OT' | 'SO';
  winnerTeamId: string;
  loserTeamId: string;
  stars: string[]; // player ids, best first
  homeSkaters: GamePlayerStat[];
  awaySkaters: GamePlayerStat[];
  homeGoalieId: string | null;
  awayGoalieId: string | null;
  seed: number;
  recap: string;
}

export interface TeamStanding {
  teamId: string;
  gamesPlayed: number;
  wins: number;
  regulationLosses: number;
  otLosses: number;
  points: number;
  regulationWins: number;
  goalsFor: number;
  goalsAgainst: number;
  homeWins: number;
  homeLosses: number;
  awayWins: number;
  awayLosses: number;
  last10: ('W' | 'L' | 'O')[];
  streak: { type: 'W' | 'L' | 'O'; count: number } | null;
}

export type InboxCategory =
  | 'Urgent'
  | 'Action'
  | 'Team'
  | 'League'
  | 'Trade'
  | 'Contract'
  | 'Scouting'
  | 'Medical'
  | 'Owner'
  | 'Staff'
  | 'Media'
  | 'Finance'
  | 'Development'
  | 'Awards';

export interface InboxMessage {
  id: string;
  date: string;
  category: InboxCategory;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  sender: string;
  subject: string;
  body: string;
  read: boolean;
  archived: boolean;
  relatedTeamId?: string;
  relatedPlayerId?: string;
}

/** Line configuration for a team. Ids reference players. */
export interface LineConfig {
  forwardLines: [string | null, string | null, string | null][]; // 4 lines x 3
  defensePairs: [string | null, string | null][]; // 3 pairs x 2
  starter: string | null;
  backup: string | null;
  powerPlay1: string[];
  penaltyKill1: string[];
}

export type ManagementPhilosophy =
  | 'Balanced'
  | 'Draft and Develop'
  | 'Aggressive Contender'
  | 'Rebuild Specialist'
  | 'Analytics-First'
  | 'Player-First'
  | 'Cap Strategist'
  | 'Veteran-Focused';

export interface GMProfile {
  name: string;
  age: number;
  nationality: string;
  philosophy: ManagementPhilosophy;
  tradeAggressiveness: number; // 0-100
  analyticsPreference: number; // 0-100
  playerLoyalty: number; // 0-100
}

/** A complete, self-contained franchise save. */
export interface Franchise {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;

  gm: GMProfile;
  userTeamId: string;

  currentDate: string; // ISO date
  seasonStartYear: number;

  teams: Team[];
  players: Player[];
  contracts: Contract[];
  schedule: ScheduledGame[];
  standings: TeamStanding[];
  lines: Record<string, LineConfig>; // teamId -> lines
  inbox: InboxMessage[];

  ownerConfidence: number; // 0-100
  fanSatisfaction: number; // 0-100
  teamMorale: number; // 0-100

  rngState: number; // master seed counter for reproducible sim

  snapshot: DatabaseSnapshotMeta;
}

export interface DatabaseSnapshotMeta {
  snapshotDate: string;
  lastRosterUpdate: string;
  lastContractUpdate: string;
  lastTransactionUpdate: string;
  sources: string[];
  notes: string;
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  entityId?: string;
}

export interface ValidationReport {
  generatedAt: string;
  issues: ValidationIssue[];
  counts: {
    teams: number;
    players: number;
    contracts: number;
    scheduledGames: number;
    estimatedFields: number;
    missingFields: number;
    errors: number;
    warnings: number;
  };
}

export interface FranchiseSummary {
  id: string;
  name: string;
  userTeamAbbrev: string;
  currentDate: string;
  updatedAt: string;
}
