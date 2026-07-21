import type { Team } from '@/types';

/**
 * The 32 real NHL teams with real names, cities, conferences and divisions.
 * This structural data is factual and public. Colors are approximate text
 * accents only — NO copyrighted logos are bundled (logoUrl is user-supplied).
 * lastSeasonRecord values are ESTIMATED placeholders for team-select cards and
 * are flagged as such on the Database Status screen.
 */
export const NHL_TEAMS: Team[] = [
  // Atlantic (Eastern)
  t('BOS', 'Bruins', 'Boston', 'Eastern', 'Atlantic', '#FFB81C', '#000000', 'TD Garden', 33, 39, 10),
  t('BUF', 'Sabres', 'Buffalo', 'Eastern', 'Atlantic', '#003087', '#FFB81C', 'KeyBank Center', 36, 39, 7),
  t('DET', 'Red Wings', 'Detroit', 'Eastern', 'Atlantic', '#CE1126', '#FFFFFF', 'Little Caesars Arena', 39, 35, 8),
  t('FLA', 'Panthers', 'Florida', 'Eastern', 'Atlantic', '#C8102E', '#B9975B', 'Amerant Bank Arena', 47, 31, 4),
  t('MTL', 'Canadiens', 'Montreal', 'Eastern', 'Atlantic', '#AF1E2D', '#192168', 'Bell Centre', 40, 31, 11),
  t('OTT', 'Senators', 'Ottawa', 'Eastern', 'Atlantic', '#C52032', '#000000', 'Canadian Tire Centre', 45, 30, 7),
  t('TBL', 'Lightning', 'Tampa Bay', 'Eastern', 'Atlantic', '#00205B', '#FFFFFF', 'Amalie Arena', 47, 27, 8),
  t('TOR', 'Maple Leafs', 'Toronto', 'Eastern', 'Atlantic', '#00205B', '#FFFFFF', 'Scotiabank Arena', 52, 26, 4),
  // Metropolitan (Eastern)
  t('CAR', 'Hurricanes', 'Carolina', 'Eastern', 'Metropolitan', '#CC0000', '#000000', 'Lenovo Center', 47, 30, 5),
  t('CBJ', 'Blue Jackets', 'Columbus', 'Eastern', 'Metropolitan', '#002654', '#CE1126', 'Nationwide Arena', 40, 33, 9),
  t('NJD', 'Devils', 'New Jersey', 'Eastern', 'Metropolitan', '#CE1126', '#000000', 'Prudential Center', 42, 33, 7),
  t('NYI', 'Islanders', 'New York', 'Eastern', 'Metropolitan', '#00539B', '#F47D30', 'UBS Arena', 35, 35, 12),
  t('NYR', 'Rangers', 'New York', 'Eastern', 'Metropolitan', '#0038A8', '#CE1126', 'Madison Square Garden', 39, 36, 7),
  t('PHI', 'Flyers', 'Philadelphia', 'Eastern', 'Metropolitan', '#F74902', '#000000', 'Wells Fargo Center', 33, 39, 10),
  t('PIT', 'Penguins', 'Pittsburgh', 'Eastern', 'Metropolitan', '#FCB514', '#000000', 'PPG Paints Arena', 34, 36, 12),
  t('WSH', 'Capitals', 'Washington', 'Eastern', 'Metropolitan', '#C8102E', '#041E42', 'Capital One Arena', 51, 22, 9),
  // Central (Western)
  t('CHI', 'Blackhawks', 'Chicago', 'Western', 'Central', '#CF0A2C', '#000000', 'United Center', 25, 46, 11),
  t('COL', 'Avalanche', 'Colorado', 'Western', 'Central', '#6F263D', '#236192', 'Ball Arena', 49, 29, 4),
  t('DAL', 'Stars', 'Dallas', 'Western', 'Central', '#006847', '#8F8F8C', 'American Airlines Center', 50, 26, 6),
  t('MIN', 'Wild', 'Minnesota', 'Western', 'Central', '#154734', '#A6192E', 'Grand Casino Arena', 45, 30, 7),
  t('NSH', 'Predators', 'Nashville', 'Western', 'Central', '#FFB81C', '#041E42', 'Bridgestone Arena', 30, 44, 8),
  t('STL', 'Blues', 'St. Louis', 'Western', 'Central', '#002F87', '#FCB514', 'Enterprise Center', 44, 30, 8),
  t('UTA', 'Mammoth', 'Utah', 'Western', 'Central', '#71AFE5', '#090909', 'Delta Center', 38, 31, 13),
  t('WPG', 'Jets', 'Winnipeg', 'Western', 'Central', '#041E42', '#004C97', 'Canada Life Centre', 56, 22, 4),
  // Pacific (Western)
  t('ANA', 'Ducks', 'Anaheim', 'Western', 'Pacific', '#F47A38', '#B09862', 'Honda Center', 35, 37, 10),
  t('CGY', 'Flames', 'Calgary', 'Western', 'Pacific', '#C8102E', '#F1BE48', 'Scotiabank Saddledome', 41, 27, 14),
  t('EDM', 'Oilers', 'Edmonton', 'Western', 'Pacific', '#FF4C00', '#041E42', 'Rogers Place', 48, 29, 5),
  t('LAK', 'Kings', 'Los Angeles', 'Western', 'Pacific', '#111111', '#A2AAAD', 'Crypto.com Arena', 48, 25, 9),
  t('SJS', 'Sharks', 'San Jose', 'Western', 'Pacific', '#006D75', '#EA7200', 'SAP Center', 22, 50, 10),
  t('SEA', 'Kraken', 'Seattle', 'Western', 'Pacific', '#001628', '#99D9D9', 'Climate Pledge Arena', 35, 41, 6),
  t('VAN', 'Canucks', 'Vancouver', 'Western', 'Pacific', '#00205B', '#00843D', 'Rogers Arena', 39, 33, 10),
  t('VGK', 'Golden Knights', 'Vegas', 'Western', 'Pacific', '#B4975A', '#333F42', 'T-Mobile Arena', 50, 25, 7),
];

function t(
  abbrev: string,
  name: string,
  city: string,
  conference: Team['conference'],
  division: Team['division'],
  primaryColor: string,
  secondaryColor: string,
  arena: string,
  wins: number,
  losses: number,
  otLosses: number,
): Team {
  return {
    id: abbrev,
    abbrev,
    name,
    city,
    conference,
    division,
    primaryColor,
    secondaryColor,
    arena,
    lastSeasonRecord: { wins, losses, otLosses },
    dataStatus: 'verified', // team identity/structure is factual; records estimated
  };
}

export const TEAM_BY_ID: Record<string, Team> = Object.fromEntries(
  NHL_TEAMS.map((team) => [team.id, team]),
);
