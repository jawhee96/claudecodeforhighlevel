import type {
  Contract,
  DefenceArchetype,
  ForwardArchetype,
  GoalieArchetype,
  GoalieRatings,
  Player,
  Position,
  SkaterRatings,
  Team,
} from '@/types';
import { emptyGoalieStats, emptySkaterStats } from '@/types';
import { NHL_TEAMS } from './teams';
import { FIRST_NAMES, LAST_NAMES, NATIONALITIES } from './names';
import { Rng } from '@/engine/random/rng';

const FORWARD_ARCH: ForwardArchetype[] = [
  'Sniper', 'Playmaker', 'Power Forward', 'Two-Way Forward', 'Defensive Forward',
  'Grinder', 'Energy Forward', 'Net-Front Scorer', 'Transition Forward',
];
const DEFENCE_ARCH: DefenceArchetype[] = [
  'Offensive Defenceman', 'Puck-Moving Defenceman', 'Two-Way Defenceman',
  'Defensive Defenceman', 'Shutdown Defenceman', 'Physical Defenceman',
];
const GOALIE_ARCH: GoalieArchetype[] = ['Butterfly', 'Hybrid', 'Athletic', 'Positional', 'Puck-Playing'];

export interface SeedResult {
  teams: Team[];
  players: Player[];
  contracts: Contract[];
}

/** Team strength baseline derived from last-season points (estimated). */
function teamStrength(team: Team): number {
  const pts = team.lastSeasonRecord.wins * 2 + team.lastSeasonRecord.otLosses;
  // Map ~44..116 points into roughly 74..90 mean overall.
  return 74 + ((pts - 44) / (116 - 44)) * 16;
}

function pickNationality(rng: Rng): string {
  const total = NATIONALITIES.reduce((s, n) => s + n.weight, 0);
  let r = rng.float() * total;
  for (const n of NATIONALITIES) {
    r -= n.weight;
    if (r <= 0) return n.code;
  }
  return 'CAN';
}

function clamp(n: number, lo = 1, hi = 99): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function makeSkaterRatings(rng: Rng, overall: number, arch: ForwardArchetype | DefenceArchetype): SkaterRatings {
  const base = (spread: number) => clamp(rng.normal(overall, spread));
  const r: SkaterRatings = {
    speed: base(7),
    shooting: base(9),
    passing: base(9),
    puckControl: base(8),
    offensiveIQ: base(9),
    defensiveIQ: base(9),
    physicality: base(10),
    faceoffs: base(12),
    discipline: base(10),
    hockeyIQ: base(7),
  };
  // Archetype tilts
  if (arch === 'Sniper') r.shooting = clamp(r.shooting + 8);
  if (arch === 'Playmaker') { r.passing = clamp(r.passing + 8); r.offensiveIQ = clamp(r.offensiveIQ + 5); }
  if (arch === 'Power Forward' || arch === 'Physical Defenceman') r.physicality = clamp(r.physicality + 9);
  if (arch === 'Defensive Forward' || arch === 'Shutdown Defenceman' || arch === 'Defensive Defenceman')
    r.defensiveIQ = clamp(r.defensiveIQ + 8);
  if (arch === 'Offensive Defenceman' || arch === 'Puck-Moving Defenceman') {
    r.passing = clamp(r.passing + 6); r.offensiveIQ = clamp(r.offensiveIQ + 4);
  }
  return r;
}

function makeGoalieRatings(rng: Rng, overall: number, arch: GoalieArchetype): GoalieRatings {
  const base = (spread: number) => clamp(rng.normal(overall, spread));
  const r: GoalieRatings = {
    reflexes: base(7),
    positioning: base(7),
    reboundControl: base(8),
    lateralMovement: base(8),
    puckHandling: base(10),
    composure: base(8),
    consistency: base(9),
  };
  if (arch === 'Athletic') r.reflexes = clamp(r.reflexes + 7);
  if (arch === 'Positional') r.positioning = clamp(r.positioning + 7);
  if (arch === 'Puck-Playing') r.puckHandling = clamp(r.puckHandling + 12);
  return r;
}

interface SlotSpec {
  position: Position;
  tier: number; // relative to team baseline; higher = better
}

/** Roster template: 14 F, 7 D, 2 G = 23-man active plus depth handled by tiers. */
function rosterTemplate(): SlotSpec[] {
  const slots: SlotSpec[] = [];
  const fwdPos: Position[] = ['C', 'LW', 'RW'];
  // 4 lines of forwards (12) + 2 extras
  const fwdTiers = [10, 8, 8, 6, 6, 5, 3, 2, 2, 0, 0, -2, -4, -5];
  for (let i = 0; i < 14; i++) {
    slots.push({ position: fwdPos[i % 3], tier: fwdTiers[i] });
  }
  // 3 pairs of D (6) + 1 extra
  const dPos: Position[] = ['LD', 'RD'];
  const dTiers = [9, 7, 5, 4, 2, 0, -4];
  for (let i = 0; i < 7; i++) {
    slots.push({ position: dPos[i % 2], tier: dTiers[i] });
  }
  slots.push({ position: 'G', tier: 8 });
  slots.push({ position: 'G', tier: 2 });
  return slots;
}

let playerCounter = 0;

function generatePlayer(rng: Rng, team: Team, slot: SlotSpec, seasonStartYear: number): { player: Player; contract: Contract } {
  playerCounter += 1;
  const id = `P${String(playerCounter).padStart(5, '0')}`;
  const firstName = rng.pick(FIRST_NAMES);
  const lastName = rng.pick(LAST_NAMES);
  const fullName = `${firstName} ${lastName}`;

  const baseline = teamStrength(team);
  const overall = clamp(rng.normal(baseline + slot.tier, 3), 45, 99);

  // Age distribution: 18-40, weighted toward 22-30.
  const age = clamp(rng.normal(26, 4), 18, 40);
  const birthYear = seasonStartYear - age;
  const birthDate = `${birthYear}-${String(rng.int(1, 12)).padStart(2, '0')}-${String(rng.int(1, 28)).padStart(2, '0')}`;

  const isG = slot.position === 'G';
  const archetype = isG
    ? rng.pick(GOALIE_ARCH)
    : slot.position === 'LD' || slot.position === 'RD'
      ? rng.pick(DEFENCE_ARCH)
      : rng.pick(FORWARD_ARCH);

  // Potential: younger players get higher ceilings; scouting confidence lower.
  const growth = Math.max(0, (27 - age)) * rng.range(0.3, 1.1);
  const potential = clamp(overall + growth, overall, 99);
  const potentialLow = clamp(potential - rng.range(2, 6), overall, 99);
  const potentialHigh = clamp(potential + rng.range(2, 8), overall, 99);
  const scoutingConfidence = clamp(age >= 24 ? rng.range(80, 97) : rng.range(45, 80), 30, 99);

  const player: Player = {
    id,
    firstName,
    lastName,
    fullName,
    birthDate,
    age,
    nationality: pickNationality(rng),
    position: slot.position,
    shootsCatches: rng.chance(0.66) ? 'L' : 'R',
    currentTeamId: team.id,
    leagueLevel: 'NHL',
    rosterStatus: 'ACTIVE',
    overall,
    potential,
    potentialLow,
    potentialHigh,
    archetype,
    scoutingConfidence,
    contractId: `C_${id}`,
    morale: clamp(rng.normal(70, 10), 30, 99),
    durability: clamp(rng.normal(75, 12), 30, 99),
    leadership: clamp(rng.normal(50, 18), 5, 99),
    injury: null,
    regularSeasonStats: isG ? emptyGoalieStats() : emptySkaterStats(),
    dataStatus: 'estimated',
    ...(isG
      ? { goalieRatings: makeGoalieRatings(rng, overall, archetype as GoalieArchetype) }
      : { skaterRatings: makeSkaterRatings(rng, overall, archetype as ForwardArchetype | DefenceArchetype) }),
  };

  const contract = generateContract(rng, player, seasonStartYear);
  return { player, contract };
}

function generateContract(rng: Rng, player: Player, seasonStartYear: number): Contract {
  // AAV roughly scales with overall^ (superlinear) — stars earn far more.
  const o = player.overall;
  let aav: number;
  if (player.age <= 22 && player.overall < 80) {
    // Entry-level style deal.
    aav = rng.int(850_000, 950_000);
  } else {
    const norm = Math.max(0, (o - 55) / 45); // 0..~1
    aav = Math.round((0.775 + Math.pow(norm, 2.4) * 12) * 1_000_000);
    aav = Math.round(aav / 25_000) * 25_000;
  }
  const term = player.age <= 22 ? 3 : rng.int(1, 7);
  const startSeason = seasonStartYear;
  const endSeason = startSeason + term - 1;
  const type: Contract['type'] = player.age <= 22 && player.overall < 80 ? 'entry-level' : 'one-way';
  const years = [];
  for (let s = startSeason; s <= endSeason; s++) {
    years.push({ season: s, capHit: aav, salary: aav, signingBonus: 0 });
  }
  return {
    id: `C_${player.id}`,
    playerId: player.id,
    type,
    aav,
    totalValue: aav * term,
    startSeason,
    endSeason,
    years,
    noTradeClause: player.overall >= 86 && rng.chance(0.5),
    noMovementClause: player.overall >= 90 && rng.chance(0.4),
    signingBonusTotal: 0,
    dataStatus: 'estimated',
  };
}

/**
 * Build the full starting database. Deterministic for a given seed.
 * @param seed master seed
 * @param seasonStartYear e.g. 2026 for the 2026-27 season
 */
export function generateSeedDatabase(seed: number | string, seasonStartYear = 2026): SeedResult {
  playerCounter = 0;
  const players: Player[] = [];
  const contracts: Contract[] = [];

  NHL_TEAMS.forEach((team, idx) => {
    // Deterministic per-team stream so teams are independent & reproducible.
    const rng = new Rng(`${seed}|${team.id}|${idx}`);
    const template = rosterTemplate();
    for (const slot of template) {
      const { player, contract } = generatePlayer(rng, team, slot, seasonStartYear);
      players.push(player);
      contracts.push(contract);
    }
  });

  return { teams: NHL_TEAMS, players, contracts };
}
