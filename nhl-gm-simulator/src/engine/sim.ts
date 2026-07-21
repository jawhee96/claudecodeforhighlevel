import type {
  Franchise,
  GameResult,
  GoalieStatLine,
  InboxMessage,
  Player,
  ScheduledGame,
  SkaterStatLine,
} from '@/types';
import { isGoalie } from '@/types';
import { simulateGame } from './gameSim';
import { applyResultToStandings } from './standings';
import { Rng } from './random/rng';

const MS_PER_DAY = 86_400_000;

export function addDaysIso(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * MS_PER_DAY).toISOString().slice(0, 10);
}

export interface SimStepResult {
  gamesPlayed: number;
  newMessages: InboxMessage[];
  stopped: boolean;
  stopReason?: string;
}

/**
 * Advance the franchise by simulating all games scheduled on `currentDate`,
 * then move the clock forward one day. Mutates the franchise in place and
 * returns a summary. Deterministic given franchise.rngState.
 */
export function simulateOneDay(f: Franchise): SimStepResult {
  const today = f.currentDate;
  const teamById = new Map(f.teams.map((t) => [t.id, t]));
  const playerById = new Map(f.players.map((p) => [p.id, p]));

  const todaysGames = f.schedule.filter((g) => g.date === today && !g.played);
  const newMessages: InboxMessage[] = [];
  let gamesPlayed = 0;
  const gamesByTeam = new Map<string, number>();

  for (const game of todaysGames) {
    const homeTeam = teamById.get(game.homeTeamId);
    const awayTeam = teamById.get(game.awayTeamId);
    if (!homeTeam || !awayTeam) continue;

    const seed = `${f.rngState}|${game.id}`;
    const result = simulateGame({ homeTeam, awayTeam, players: f.players, seed });
    game.result = result;
    game.played = true;
    gamesPlayed++;

    applyResultToStandings(f.standings, game);
    applyStatsToPlayers(result, game, playerById);
    gamesByTeam.set(game.homeTeamId, (gamesByTeam.get(game.homeTeamId) ?? 0) + 1);
    gamesByTeam.set(game.awayTeamId, (gamesByTeam.get(game.awayTeamId) ?? 0) + 1);

    // Inbox for user's team games.
    if (game.homeTeamId === f.userTeamId || game.awayTeamId === f.userTeamId) {
      newMessages.push(gameRecapMessage(f, game, result));
    }
  }

  // Recover existing injuries based on games played, then roll for new ones.
  recoverInjuries(f, gamesByTeam);
  if (gamesPlayed > 0) {
    maybeInjury(f, newMessages);
  }

  f.rngState = (f.rngState + 1) >>> 0;
  f.currentDate = addDaysIso(today, 1);
  f.updatedAt = new Date().toISOString();

  f.inbox.unshift(...newMessages);

  const stopReason = newMessages.find((m) => m.priority === 'urgent')?.subject;
  return { gamesPlayed, newMessages, stopped: !!stopReason, stopReason };
}

function applyStatsToPlayers(
  result: GameResult,
  game: ScheduledGame,
  playerById: Map<string, Player>,
): void {
  const both = [
    { stats: result.homeSkaters, goalieId: result.homeGoalieId, teamId: game.homeTeamId },
    { stats: result.awaySkaters, goalieId: result.awayGoalieId, teamId: game.awayTeamId },
  ];
  for (const side of both) {
    for (const s of side.stats) {
      const p = playerById.get(s.playerId);
      if (!p || isGoalie(p)) continue;
      const st = p.regularSeasonStats as SkaterStatLine;
      st.gamesPlayed++;
      st.goals += s.goals;
      st.assists += s.assists;
      st.points = st.goals + st.assists;
      st.shots += s.shots;
      st.toiSeconds += s.toiSeconds;
    }
  }

  // Goalie stats.
  const winner = result.winnerTeamId;
  applyGoalie(result.homeGoalieId, playerById, result.awayShots, result.awayGoals, game.homeTeamId === winner, result.endedIn);
  applyGoalie(result.awayGoalieId, playerById, result.homeShots, result.homeGoals, game.awayTeamId === winner, result.endedIn);
}

function applyGoalie(
  goalieId: string | null,
  playerById: Map<string, Player>,
  shotsAgainst: number,
  goalsAgainst: number,
  won: boolean,
  endedIn: GameResult['endedIn'],
): void {
  if (!goalieId) return;
  const g = playerById.get(goalieId);
  if (!g) return;
  const st = g.regularSeasonStats as GoalieStatLine;
  st.gamesPlayed++;
  st.shotsAgainst += shotsAgainst;
  st.goalsAgainst += goalsAgainst;
  st.saves += Math.max(0, shotsAgainst - goalsAgainst);
  st.toiSeconds += 3600;
  if (won) st.wins++;
  else if (endedIn === 'REG') st.losses++;
  else st.otLosses++;
  if (goalsAgainst === 0 && won) st.shutouts++;
}

function gameRecapMessage(f: Franchise, game: ScheduledGame, result: GameResult): InboxMessage {
  const userIsHome = game.homeTeamId === f.userTeamId;
  const userGoals = userIsHome ? result.homeGoals : result.awayGoals;
  const oppGoals = userIsHome ? result.awayGoals : result.homeGoals;
  const won = result.winnerTeamId === f.userTeamId;
  const oppId = userIsHome ? game.awayTeamId : game.homeTeamId;
  const opp = f.teams.find((t) => t.id === oppId);
  return {
    id: `M_${game.id}`,
    date: game.date,
    category: 'Team',
    priority: 'low',
    sender: 'Team Reporter',
    subject: `${won ? 'W' : 'L'} ${userGoals}-${oppGoals} vs ${opp?.abbrev ?? '???'}`,
    body: result.recap,
    read: false,
    archived: false,
    relatedTeamId: f.userTeamId,
  };
}

function maybeInjury(f: Franchise, messages: InboxMessage[]): void {
  const rng = new Rng(`${f.rngState}|injury|${f.currentDate}`);
  const roster = f.players.filter(
    (p) => p.currentTeamId === f.userTeamId && p.rosterStatus === 'ACTIVE' && !p.injury,
  );
  if (roster.length === 0) return;
  if (!rng.chance(0.04)) return;

  const victim = rng.pick(roster);
  const severities = [
    { type: 'Lower-body', severity: 'minor' as const, games: rng.int(1, 4) },
    { type: 'Upper-body', severity: 'moderate' as const, games: rng.int(4, 12) },
    { type: 'Concussion', severity: 'major' as const, games: rng.int(10, 25) },
  ];
  const inj = rng.pick(severities);
  victim.injury = { type: inj.type, severity: inj.severity, gamesRemaining: inj.games };
  victim.rosterStatus = inj.severity === 'major' ? 'IR' : 'SCRATCHED';

  messages.push({
    id: `INJ_${victim.id}_${f.currentDate}`,
    date: f.currentDate,
    category: 'Medical',
    priority: inj.severity === 'major' ? 'urgent' : 'high',
    sender: 'Head Athletic Therapist',
    subject: `Injury: ${victim.fullName} (${inj.type})`,
    body: `${victim.fullName} suffered a ${inj.severity} ${inj.type.toLowerCase()} injury and is expected to miss approximately ${inj.games} games. Medical staff recommends ${inj.severity === 'major' ? 'placement on IR and full rest' : 'day-to-day evaluation'}.`,
    read: false,
    archived: false,
    relatedTeamId: f.userTeamId,
    relatedPlayerId: victim.id,
  });
}

/** Heal injuries by decrementing games remaining after each game the player's team plays. */
export function recoverInjuries(f: Franchise, gamesByTeam: Map<string, number>): void {
  for (const p of f.players) {
    if (!p.injury || !p.currentTeamId) continue;
    const teamGames = gamesByTeam.get(p.currentTeamId) ?? 0;
    if (teamGames <= 0) continue;
    p.injury.gamesRemaining -= teamGames;
    if (p.injury.gamesRemaining <= 0) {
      p.injury = null;
      p.rosterStatus = 'ACTIVE';
    }
  }
}
