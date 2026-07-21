import type { Contract, Player } from '@/types';
import { LEAGUE_RULES } from '@/data/leagueRules';

export interface CapSummary {
  capUpperLimit: number;
  capLowerLimit: number;
  activeCapHit: number;
  capSpace: number;
  contractCount: number; // toward the 50-contract limit
  activeRosterCount: number;
  overCap: boolean;
  belowFloor: boolean;
  rosterValid: boolean;
  messages: string[];
}

/**
 * Compute a team's cap situation for the current season.
 * A player counts against the active cap if on the NHL roster (ACTIVE/SCRATCHED/IR).
 */
export function computeCapSummary(
  teamId: string,
  players: Player[],
  contracts: Contract[],
  season: number,
): CapSummary {
  const contractById = new Map(contracts.map((c) => [c.id, c]));
  const teamPlayers = players.filter((p) => p.currentTeamId === teamId);

  const capCountingStatuses = new Set(['ACTIVE', 'SCRATCHED', 'IR']);
  let activeCapHit = 0;
  let activeRosterCount = 0;
  let contractCount = 0;

  for (const p of teamPlayers) {
    if (p.contractId) {
      const c = contractById.get(p.contractId);
      if (c && season >= c.startSeason && season <= c.endSeason) {
        contractCount++;
        if (capCountingStatuses.has(p.rosterStatus)) {
          activeCapHit += c.aav;
        }
      }
    }
    if (p.rosterStatus === 'ACTIVE') activeRosterCount++;
  }

  const capSpace = LEAGUE_RULES.salaryCapUpperLimit - activeCapHit;
  const overCap = capSpace < 0;
  const belowFloor = activeCapHit < LEAGUE_RULES.salaryCapLowerLimit;

  const messages: string[] = [];
  if (overCap) messages.push(`Over the cap by ${money(-capSpace)}.`);
  if (belowFloor) messages.push(`Below the cap floor by ${money(LEAGUE_RULES.salaryCapLowerLimit - activeCapHit)}.`);
  if (activeRosterCount > LEAGUE_RULES.activeRosterMaximum)
    messages.push(`Active roster (${activeRosterCount}) exceeds max of ${LEAGUE_RULES.activeRosterMaximum}.`);
  if (activeRosterCount < LEAGUE_RULES.activeRosterMinimum)
    messages.push(`Active roster (${activeRosterCount}) below min of ${LEAGUE_RULES.activeRosterMinimum}.`);
  if (contractCount > LEAGUE_RULES.contractLimit)
    messages.push(`Contract count (${contractCount}) exceeds limit of ${LEAGUE_RULES.contractLimit}.`);

  const rosterValid =
    !overCap &&
    activeRosterCount <= LEAGUE_RULES.activeRosterMaximum &&
    contractCount <= LEAGUE_RULES.contractLimit;

  return {
    capUpperLimit: LEAGUE_RULES.salaryCapUpperLimit,
    capLowerLimit: LEAGUE_RULES.salaryCapLowerLimit,
    activeCapHit,
    capSpace,
    contractCount,
    activeRosterCount,
    overCap,
    belowFloor,
    rosterValid,
    messages,
  };
}

export function money(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs}`;
}
