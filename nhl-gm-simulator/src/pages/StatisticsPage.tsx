import { useMemo, useState } from 'react';
import { useFranchiseStore } from '@/state/franchiseStore';
import { isSkaterStats, savePct, gaa, toi } from '@/utils/format';
import type { GoalieStatLine, Player, SkaterStatLine } from '@/types';
import { isGoalie } from '@/types';

export function StatisticsPage() {
  const f = useFranchiseStore((s) => s.franchise)!;
  const [scope, setScope] = useState<'team' | 'league'>('league');
  const [tab, setTab] = useState<'skaters' | 'goalies'>('skaters');
  const teamById = useMemo(() => new Map(f.teams.map((t) => [t.id, t])), [f]);

  const pool = useMemo(
    () => (scope === 'team' ? f.players.filter((p) => p.currentTeamId === f.userTeamId) : f.players),
    [f, scope],
  );

  const skaters = useMemo(
    () => pool.filter((p) => isSkaterStats(p) && (p.regularSeasonStats as SkaterStatLine).gamesPlayed > 0)
      .sort((a, b) => (b.regularSeasonStats as SkaterStatLine).points - (a.regularSeasonStats as SkaterStatLine).points)
      .slice(0, 50),
    [pool],
  );

  const goalies = useMemo(
    () => pool.filter((p) => isGoalie(p) && (p.regularSeasonStats as GoalieStatLine).gamesPlayed > 0)
      .sort((a, b) => savePctNum(b) - savePctNum(a))
      .slice(0, 30),
    [pool],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Statistics</h1>
        <div className="flex gap-1.5">
          <button className={`btn px-2.5 py-1 ${scope === 'league' ? 'btn-primary' : ''}`} onClick={() => setScope('league')}>League</button>
          <button className={`btn px-2.5 py-1 ${scope === 'team' ? 'btn-primary' : ''}`} onClick={() => setScope('team')}>My Team</button>
        </div>
      </div>
      <div className="flex gap-1.5">
        <button className={`btn px-2.5 py-1 ${tab === 'skaters' ? 'btn-primary' : ''}`} onClick={() => setTab('skaters')}>Skaters</button>
        <button className={`btn px-2.5 py-1 ${tab === 'goalies' ? 'btn-primary' : ''}`} onClick={() => setTab('goalies')}>Goalies</button>
      </div>

      <div className="card max-h-[70vh] overflow-auto">
        {tab === 'skaters' ? (
          <table className="w-full table-compact">
            <thead className="sticky top-0 bg-ice-panel"><tr>
              <th>#</th><th>Player</th><th>Team</th><th>Pos</th><th>GP</th><th>G</th><th>A</th><th>P</th><th>SOG</th><th>TOI/GP</th>
            </tr></thead>
            <tbody>
              {skaters.map((p, i) => {
                const s = p.regularSeasonStats as SkaterStatLine;
                return (
                  <tr key={p.id} className={p.currentTeamId === f.userTeamId ? 'bg-ice-accent/5' : ''}>
                    <td className="text-ice-muted">{i + 1}</td>
                    <td className="font-medium">{p.fullName}</td>
                    <td className="text-ice-muted">{teamById.get(p.currentTeamId ?? '')?.abbrev ?? '—'}</td>
                    <td>{p.position}</td>
                    <td>{s.gamesPlayed}</td><td>{s.goals}</td><td>{s.assists}</td><td className="font-semibold">{s.points}</td>
                    <td>{s.shots}</td><td className="font-mono text-xs">{toi(Math.round(s.toiSeconds / Math.max(1, s.gamesPlayed)))}</td>
                  </tr>
                );
              })}
              {skaters.length === 0 && <tr><td colSpan={10} className="py-8 text-center text-ice-muted">Simulate games to populate statistics.</td></tr>}
            </tbody>
          </table>
        ) : (
          <table className="w-full table-compact">
            <thead className="sticky top-0 bg-ice-panel"><tr>
              <th>#</th><th>Goalie</th><th>Team</th><th>GP</th><th>W</th><th>L</th><th>OTL</th><th>SV%</th><th>GAA</th><th>SO</th>
            </tr></thead>
            <tbody>
              {goalies.map((p, i) => {
                const g = p.regularSeasonStats as GoalieStatLine;
                return (
                  <tr key={p.id} className={p.currentTeamId === f.userTeamId ? 'bg-ice-accent/5' : ''}>
                    <td className="text-ice-muted">{i + 1}</td>
                    <td className="font-medium">{p.fullName}</td>
                    <td className="text-ice-muted">{teamById.get(p.currentTeamId ?? '')?.abbrev ?? '—'}</td>
                    <td>{g.gamesPlayed}</td><td>{g.wins}</td><td>{g.losses}</td><td>{g.otLosses}</td>
                    <td className="font-mono">{savePct(g)}</td><td className="font-mono">{gaa(g)}</td><td>{g.shutouts}</td>
                  </tr>
                );
              })}
              {goalies.length === 0 && <tr><td colSpan={10} className="py-8 text-center text-ice-muted">Simulate games to populate statistics.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function savePctNum(p: Player): number {
  const g = p.regularSeasonStats as GoalieStatLine;
  return g.shotsAgainst === 0 ? 0 : g.saves / g.shotsAgainst;
}
