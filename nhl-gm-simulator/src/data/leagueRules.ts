/**
 * League rules live in configuration, not scattered through the engine.
 * Cap figures reflect the publicly reported NHL upper/lower limits for the
 * 2026-27 league year. They are marked ESTIMATED in the database status screen
 * and are user-editable in a full build.
 */
export interface LeagueRules {
  regularSeasonGames: number;
  pointsForWin: number;
  pointsForOvertimeLoss: number;
  playoffTeamsPerConference: number;
  wildcardsPerConference: number;
  salaryCapUpperLimit: number;
  salaryCapLowerLimit: number;
  activeRosterMaximum: number;
  activeRosterMinimum: number;
  contractLimit: number; // max 50-man reserve list style limit
  retainedSalarySlotLimit: number;
  maximumRetainedPercentage: number;
}

export const LEAGUE_RULES: LeagueRules = {
  regularSeasonGames: 82,
  pointsForWin: 2,
  pointsForOvertimeLoss: 1,
  playoffTeamsPerConference: 8,
  wildcardsPerConference: 2,
  // Reported 2026-27 upper limit ($104.0M) / lower limit. Estimated.
  salaryCapUpperLimit: 104_000_000,
  salaryCapLowerLimit: 70_600_000,
  activeRosterMaximum: 23,
  activeRosterMinimum: 20,
  contractLimit: 50,
  retainedSalarySlotLimit: 3,
  maximumRetainedPercentage: 0.5,
};

export const SCHEMA_VERSION = 1;
