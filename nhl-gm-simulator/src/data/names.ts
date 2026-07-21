/**
 * Name pools for procedurally generating a fictional-but-plausible roster.
 *
 * IMPORTANT: The Phase 1 seed does NOT ship real player identities, contracts,
 * or ratings. Doing so would mean silently inventing values presented as fact.
 * Instead we generate a full, internally-consistent league of fictional players
 * (every one flagged dataStatus: 'estimated') so the game is fully playable,
 * and we provide an import pipeline (see data/importSchema.ts) for the user to
 * load a real, authorized July 20 2026 snapshot on top of it.
 */
export const FIRST_NAMES: string[] = [
  'Connor', 'Nathan', 'Jack', 'Nico', 'Elias', 'Tim', 'Aleksander', 'Brady', 'Dylan', 'Cale',
  'Adam', 'Mikko', 'Sebastian', 'Roope', 'Jordan', 'Trevor', 'Quinn', 'Owen', 'Logan', 'Mason',
  'Lucas', 'Filip', 'Anton', 'Rasmus', 'Viktor', 'Marco', 'Andre', 'Pierre', 'Louis', 'Gabriel',
  'Matthew', 'Ryan', 'Tyler', 'Cole', 'Wyatt', 'Blake', 'Carter', 'Hunter', 'Evan', 'Noah',
  'Alexis', 'Maxime', 'Samuel', 'Zachary', 'Nolan', 'Bo', 'Kirby', 'Seth', 'Drake', 'Juraj',
];

export const LAST_NAMES: string[] = [
  'Mitchell', 'Carlson', 'Novak', 'Berg', 'Lindholm', 'Halonen', 'Petrov', 'Dubois', 'Tremblay', 'Gagne',
  'Anderson', 'Larsson', 'Nilsson', 'Karlsson', 'Forsberg', 'Holm', 'Vasiliev', 'Sokolov', 'Roy', 'Beaulieu',
  'Sullivan', 'Brennan', 'Kowalski', 'Novotny', 'Hansen', 'Jensen', 'Virtanen', 'Makinen', 'Laine', 'Koskinen',
  'Wallace', 'Barrett', 'Fletcher', 'Hayes', 'Cameron', 'Reid', 'Grant', 'Boyd', 'Ford', 'Palmer',
  'Marchand', 'Lavoie', 'Girard', 'Cormier', 'Boucher', 'Fortin', 'Leclerc', 'Simard', 'Bergeron', 'Cote',
  'Novak', 'Zima', 'Horak', 'Svoboda', 'Novikov', 'Morozov', 'Egorov', 'Volkov', 'Smirnov', 'Popov',
];

export const NATIONALITIES: { code: string; weight: number }[] = [
  { code: 'CAN', weight: 42 },
  { code: 'USA', weight: 28 },
  { code: 'SWE', weight: 9 },
  { code: 'FIN', weight: 5 },
  { code: 'RUS', weight: 6 },
  { code: 'CZE', weight: 4 },
  { code: 'SVK', weight: 2 },
  { code: 'CHE', weight: 1 },
  { code: 'DEU', weight: 1 },
  { code: 'DNK', weight: 1 },
  { code: 'OTHER', weight: 1 },
];
