import type { ScheduledGame, Team, TeamStanding } from '@/types';

export function emptyStanding(teamId: string): TeamStanding {
  return {
    teamId,
    gamesPlayed: 0,
    wins: 0,
    regulationLosses: 0,
    otLosses: 0,
    points: 0,
    regulationWins: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    homeWins: 0,
    homeLosses: 0,
    awayWins: 0,
    awayLosses: 0,
    last10: [],
    streak: null,
  };
}

export function initStandings(teams: Team[]): TeamStanding[] {
  return teams.map((t) => emptyStanding(t.id));
}

/** Apply a completed game result to the standings in place. */
export function applyResultToStandings(standings: TeamStanding[], game: ScheduledGame): void {
  const result = game.result;
  if (!result) return;
  const home = standings.find((s) => s.teamId === game.homeTeamId);
  const away = standings.find((s) => s.teamId === game.awayTeamId);
  if (!home || !away) return;

  home.gamesPlayed++;
  away.gamesPlayed++;
  home.goalsFor += result.homeGoals;
  home.goalsAgainst += result.awayGoals;
  away.goalsFor += result.awayGoals;
  away.goalsAgainst += result.homeGoals;

  const homeWon = result.winnerTeamId === game.homeTeamId;
  const inReg = result.endedIn === 'REG';

  if (homeWon) {
    home.wins++;
    home.points += 2;
    home.homeWins++;
    if (inReg) home.regulationWins++;
    away.otLosses += inReg ? 0 : 1;
    if (inReg) away.regulationLosses++;
    else away.points += 1;
    away.awayLosses++;
    recordResult(home, 'W');
    recordResult(away, inReg ? 'L' : 'O');
  } else {
    away.wins++;
    away.points += 2;
    away.awayWins++;
    if (inReg) away.regulationWins++;
    home.otLosses += inReg ? 0 : 1;
    if (inReg) home.regulationLosses++;
    else home.points += 1;
    home.homeLosses++;
    recordResult(away, 'W');
    recordResult(home, inReg ? 'L' : 'O');
  }
}

function recordResult(s: TeamStanding, r: 'W' | 'L' | 'O'): void {
  s.last10.push(r);
  if (s.last10.length > 10) s.last10.shift();
  if (s.streak && s.streak.type === r) s.streak.count++;
  else s.streak = { type: r, count: 1 };
}

/**
 * NHL tiebreakers (simplified but ordered correctly):
 * 1. Points
 * 2. Regulation Wins (RW)
 * 3. Regulation + OT Wins (ROW ~ wins here excluding SO — we approximate with wins)
 * 4. Total Wins
 * 5. Goal differential
 * 6. Goals for
 */
export function compareStandings(a: TeamStanding, b: TeamStanding): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.regulationWins !== a.regulationWins) return b.regulationWins - a.regulationWins;
  if (b.wins !== a.wins) return b.wins - a.wins;
  const diffA = a.goalsFor - a.goalsAgainst;
  const diffB = b.goalsFor - b.goalsAgainst;
  if (diffB !== diffA) return diffB - diffA;
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  return a.teamId.localeCompare(b.teamId);
}

export function sortStandings(standings: TeamStanding[]): TeamStanding[] {
  return standings.slice().sort(compareStandings);
}

export interface PlayoffPicture {
  divisionLeaders: Record<string, TeamStanding[]>; // division -> top 3
  wildcards: Record<string, TeamStanding[]>; // conference -> 2 wildcards
}

/** Compute playoff seeding: top 3 per division + 2 wildcards per conference. */
export function computePlayoffPicture(standings: TeamStanding[], teams: Team[]): PlayoffPicture {
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const divisions = ['Atlantic', 'Metropolitan', 'Central', 'Pacific'];
  const divisionLeaders: Record<string, TeamStanding[]> = {};
  const conferenceRemainder: Record<string, TeamStanding[]> = { Eastern: [], Western: [] };

  for (const div of divisions) {
    const inDiv = sortStandings(standings.filter((s) => teamById.get(s.teamId)?.division === div));
    divisionLeaders[div] = inDiv.slice(0, 3);
    const conf = teamById.get(inDiv[0]?.teamId ?? '')?.conference;
    if (conf) conferenceRemainder[conf].push(...inDiv.slice(3));
  }

  const wildcards: Record<string, TeamStanding[]> = {
    Eastern: sortStandings(conferenceRemainder.Eastern).slice(0, 2),
    Western: sortStandings(conferenceRemainder.Western).slice(0, 2),
  };

  return { divisionLeaders, wildcards };
}

export function isInPlayoffs(teamId: string, picture: PlayoffPicture): boolean {
  for (const list of Object.values(picture.divisionLeaders)) {
    if (list.some((s) => s.teamId === teamId)) return true;
  }
  for (const list of Object.values(picture.wildcards)) {
    if (list.some((s) => s.teamId === teamId)) return true;
  }
  return false;
}
