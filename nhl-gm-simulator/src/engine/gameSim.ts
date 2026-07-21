import type { GamePlayerStat, GameResult, Player, Team } from '@/types';
import { isGoalie } from '@/types';
import { Rng } from './random/rng';

interface TeamUnit {
  team: Team;
  skaters: Player[];
  goalie: Player | null;
  offense: number; // 0-100
  defense: number; // 0-100
  goaltending: number; // 0-100
}

function skaterOffense(p: Player): number {
  const r = p.skaterRatings;
  if (!r) return p.overall;
  return (r.shooting * 1.1 + r.passing + r.offensiveIQ * 1.1 + r.puckControl + r.speed) / 5.2;
}

function skaterDefense(p: Player): number {
  const r = p.skaterRatings;
  if (!r) return p.overall;
  return (r.defensiveIQ * 1.3 + r.physicality + r.hockeyIQ + r.speed) / 4.3;
}

function goalieRating(p: Player): number {
  const r = p.goalieRatings;
  if (!r) return p.overall;
  return (r.reflexes + r.positioning + r.reboundControl + r.lateralMovement + r.composure + r.consistency) / 6;
}

function buildUnit(team: Team, roster: Player[], rng: Rng): TeamUnit {
  const available = roster.filter((p) => p.currentTeamId === team.id && p.rosterStatus === 'ACTIVE' && !p.injury);
  const skaters = available.filter((p) => !isGoalie(p));
  const goalies = available.filter(isGoalie);
  // top 18 skaters by overall
  const topSkaters = skaters.sort((a, b) => b.overall - a.overall).slice(0, 18);
  const goalie = goalies.sort((a, b) => b.overall - a.overall)[0] ?? null;

  const forwards = topSkaters.filter((p) => ['C', 'LW', 'RW'].includes(p.position)).slice(0, 12);
  const defense = topSkaters.filter((p) => ['LD', 'RD'].includes(p.position)).slice(0, 6);

  const offense = avg(forwards.map(skaterOffense)) * 0.7 + avg(defense.map(skaterOffense)) * 0.3;
  const defenseRating = avg(defense.map(skaterDefense)) * 0.6 + avg(forwards.map(skaterDefense)) * 0.4;
  const goaltending = goalie ? goalieRating(goalie) : 60;

  // tiny random game-to-game form factor
  const form = rng.range(-2, 2);
  return {
    team,
    skaters: topSkaters,
    goalie,
    offense: offense + form,
    defense: defenseRating,
    goaltending,
  };
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 60;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

/** Expected goals for a unit given opponent defense & goaltending. */
function expectedGoals(off: number, oppDef: number, oppGoalie: number, homeBonus: number): number {
  const attack = off + homeBonus;
  const suppress = oppDef * 0.55 + oppGoalie * 0.45;
  // Center around 2.9 goals; each rating point of edge ~ 0.03 goals.
  const diff = attack - suppress;
  return Math.max(1.1, 2.9 + diff * 0.035);
}

function distributeScoring(
  skaters: Player[],
  goals: number,
  shots: number,
  rng: Rng,
): { stats: GamePlayerStat[]; scorers: string[] } {
  const stats: GamePlayerStat[] = skaters.map((p) => ({
    playerId: p.id,
    goals: 0,
    assists: 0,
    shots: 0,
    toiSeconds: 0,
  }));
  const weights = skaters.map((p) => Math.pow(Math.max(1, skaterOffense(p)), 2.2));
  const totalW = weights.reduce((s, w) => s + w, 0);

  const pickWeighted = (): number => {
    let r = rng.float() * totalW;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return i;
    }
    return weights.length - 1;
  };

  // distribute shots
  for (let s = 0; s < shots; s++) {
    stats[pickWeighted()].shots++;
  }
  // toi: spread ~ 20 min top line down to ~10 min
  skaters.forEach((_, i) => {
    const sorted = 20 - (i / skaters.length) * 11;
    stats[i].toiSeconds = Math.round(sorted * 60);
  });

  const scorers: string[] = [];
  for (let g = 0; g < goals; g++) {
    const scorerIdx = pickWeighted();
    stats[scorerIdx].goals++;
    scorers.push(stats[scorerIdx].playerId);
    // 0-2 assists
    const assistCount = rng.chance(0.85) ? (rng.chance(0.6) ? 2 : 1) : 0;
    const used = new Set<number>([scorerIdx]);
    for (let a = 0; a < assistCount; a++) {
      let idx = pickWeighted();
      let guard = 0;
      while (used.has(idx) && guard++ < 6) idx = pickWeighted();
      used.add(idx);
      stats[idx].assists++;
    }
  }
  return { stats, scorers };
}

export interface SimInput {
  homeTeam: Team;
  awayTeam: Team;
  players: Player[];
  seed: number | string;
}

/** Simulate a single game. Deterministic for a given seed + inputs. */
export function simulateGame(input: SimInput): GameResult {
  const rng = new Rng(input.seed);
  const home = buildUnit(input.homeTeam, input.players, rng);
  const away = buildUnit(input.awayTeam, input.players, rng);

  const homeBonus = 2.2; // home-ice advantage
  const homeXG = expectedGoals(home.offense, away.defense, away.goaltending, homeBonus);
  const awayXG = expectedGoals(away.offense, home.defense, home.goaltending, 0);

  // Shots scale with offense; ~28-34 baseline.
  const homeShots = clampInt(rng.poisson(29 + (home.offense - 78) * 0.4), 18, 48);
  const awayShots = clampInt(rng.poisson(28 + (away.offense - 78) * 0.4), 18, 48);

  let homeGoals = clampInt(rng.poisson(homeXG), 0, 10);
  let awayGoals = clampInt(rng.poisson(awayXG), 0, 10);

  let endedIn: GameResult['endedIn'] = 'REG';

  if (homeGoals === awayGoals) {
    // Overtime then shootout.
    if (rng.chance(0.56)) {
      endedIn = 'OT';
      if (rng.chance(otWinProb(home, away))) homeGoals++;
      else awayGoals++;
    } else {
      endedIn = 'SO';
      if (rng.chance(otWinProb(home, away))) homeGoals++;
      else awayGoals++;
    }
  }

  const winnerTeamId = homeGoals > awayGoals ? input.homeTeam.id : input.awayTeam.id;
  const loserTeamId = homeGoals > awayGoals ? input.awayTeam.id : input.homeTeam.id;

  // In OT/SO the extra goal shouldn't be attributed as a skater regulation goal;
  // distribute only the regulation goals for the box score.
  const homeRegGoals = endedIn === 'REG' ? homeGoals : Math.min(homeGoals, awayGoals + (winnerTeamId === input.homeTeam.id ? 0 : 0));
  const awayRegGoals = endedIn === 'REG' ? awayGoals : Math.min(awayGoals, homeGoals + (winnerTeamId === input.awayTeam.id ? 0 : 0));

  const homeDist = distributeScoring(home.skaters, endedIn === 'REG' ? homeGoals : homeRegGoals, homeShots, rng);
  const awayDist = distributeScoring(away.skaters, endedIn === 'REG' ? awayGoals : awayRegGoals, awayShots, rng);

  const stars = pickStars(homeDist.stats, awayDist.stats, home.goalie, away.goalie, winnerTeamId, input);

  const recap = buildRecap(input, homeGoals, awayGoals, endedIn, homeShots, awayShots);

  return {
    homeGoals,
    awayGoals,
    homeShots,
    awayShots,
    endedIn,
    winnerTeamId,
    loserTeamId,
    stars,
    homeSkaters: homeDist.stats,
    awaySkaters: awayDist.stats,
    homeGoalieId: home.goalie?.id ?? null,
    awayGoalieId: away.goalie?.id ?? null,
    seed: new Rng(input.seed).seed,
    recap,
  };
}

function otWinProb(a: TeamUnit, b: TeamUnit): number {
  const edge = (a.offense + a.goaltending) - (b.offense + b.goaltending);
  return Math.max(0.35, Math.min(0.65, 0.5 + edge * 0.006));
}

function pickStars(
  homeStats: GamePlayerStat[],
  awayStats: GamePlayerStat[],
  homeG: Player | null,
  awayG: Player | null,
  winnerTeamId: string,
  input: SimInput,
): string[] {
  const all = [...homeStats, ...awayStats]
    .map((s) => ({ id: s.playerId, score: s.goals * 3 + s.assists * 2 + s.shots * 0.1 }))
    .sort((a, b) => b.score - a.score);
  const winningGoalie = winnerTeamId === input.homeTeam.id ? homeG : awayG;
  const stars = all.slice(0, 3).map((s) => s.id);
  if (winningGoalie && stars.length >= 3 && all[0].score < 5) {
    stars[2] = winningGoalie.id;
  }
  return stars;
}

function buildRecap(
  input: SimInput,
  hg: number,
  ag: number,
  endedIn: GameResult['endedIn'],
  hs: number,
  as: number,
): string {
  const homeName = input.homeTeam.name;
  const awayName = input.awayTeam.name;
  const winner = hg > ag ? homeName : awayName;
  const suffix = endedIn === 'OT' ? ' in overtime' : endedIn === 'SO' ? ' in a shootout' : '';
  return `${winner} ${hg > ag ? 'defeated' : 'fell to'} ${hg > ag ? awayName : homeName} ${Math.max(hg, ag)}-${Math.min(hg, ag)}${suffix}. Shots: ${input.homeTeam.abbrev} ${hs}, ${input.awayTeam.abbrev} ${as}.`;
}

function clampInt(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}
