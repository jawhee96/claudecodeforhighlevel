import { useMemo, useState } from 'react';
import { useFranchiseStore } from '@/state/franchiseStore';
import { formatDate } from '@/components/Layout';

export function SchedulePage() {
  const f = useFranchiseStore((s) => s.franchise)!;
  const [filterUser, setFilterUser] = useState(true);
  const teamById = useMemo(() => new Map(f.teams.map((t) => [t.id, t])), [f]);

  const games = useMemo(() => {
    let list = f.schedule;
    if (filterUser) list = list.filter((g) => g.homeTeamId === f.userTeamId || g.awayTeamId === f.userTeamId);
    return list;
  }, [f, filterUser]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Schedule <span className="badge ml-2 bg-ice-warn/15 text-ice-warn">Simulated</span></h1>
        <label className="flex items-center gap-1.5 text-sm text-ice-muted">
          <input type="checkbox" checked={filterUser} onChange={(e) => setFilterUser(e.target.checked)} className="accent-ice-accent" />
          My team only
        </label>
      </div>

      <div className="card max-h-[75vh] overflow-y-auto">
        <table className="w-full table-compact">
          <thead className="sticky top-0 bg-ice-panel">
            <tr><th>Date</th><th>Matchup</th><th>Result</th><th>Status</th></tr>
          </thead>
          <tbody>
            {games.map((g) => {
              const home = teamById.get(g.homeTeamId)!;
              const away = teamById.get(g.awayTeamId)!;
              const userInvolved = g.homeTeamId === f.userTeamId || g.awayTeamId === f.userTeamId;
              return (
                <tr key={g.id} className={userInvolved ? 'bg-ice-accent/5' : ''}>
                  <td className="text-ice-muted">{formatDate(g.date)}</td>
                  <td><span className="font-medium">{away.abbrev}</span> @ <span className="font-medium">{home.abbrev}</span></td>
                  <td className="font-mono">
                    {g.played && g.result ? `${g.result.awayGoals}-${g.result.homeGoals}${g.result.endedIn !== 'REG' ? ` ${g.result.endedIn}` : ''}` : '—'}
                  </td>
                  <td>
                    {g.played
                      ? <span className="badge bg-ice-muted/15 text-ice-muted">Final</span>
                      : <span className="badge bg-ice-accent/15 text-ice-accent">Scheduled</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
