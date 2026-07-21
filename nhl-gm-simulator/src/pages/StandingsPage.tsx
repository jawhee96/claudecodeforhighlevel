import { useMemo, useState } from 'react';
import { useFranchiseStore } from '@/state/franchiseStore';
import { sortStandings } from '@/engine/standings';
import type { TeamStanding } from '@/types';

type View = 'League' | 'Eastern' | 'Western' | 'Atlantic' | 'Metropolitan' | 'Central' | 'Pacific';
const VIEWS: View[] = ['League', 'Eastern', 'Western', 'Atlantic', 'Metropolitan', 'Central', 'Pacific'];

export function StandingsPage() {
  const f = useFranchiseStore((s) => s.franchise)!;
  const [view, setView] = useState<View>('League');
  const teamById = useMemo(() => new Map(f.teams.map((t) => [t.id, t])), [f]);

  const rows = useMemo(() => {
    let list = f.standings;
    if (view === 'Eastern' || view === 'Western') list = list.filter((s) => teamById.get(s.teamId)?.conference === view);
    else if (view !== 'League') list = list.filter((s) => teamById.get(s.teamId)?.division === view);
    return sortStandings(list);
  }, [f, view, teamById]);

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Standings</h1>
      <div className="flex flex-wrap gap-1.5">
        {VIEWS.map((v) => (
          <button key={v} onClick={() => setView(v)}
            className={`btn px-2.5 py-1 ${view === v ? 'btn-primary' : ''}`}>{v}</button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full table-compact">
          <thead>
            <tr>
              <th>#</th><th>Team</th><th>GP</th><th>W</th><th>L</th><th>OTL</th><th>PTS</th>
              <th>RW</th><th>GF</th><th>GA</th><th>DIFF</th><th>L10</th><th>STRK</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => {
              const team = teamById.get(s.teamId)!;
              const isUser = s.teamId === f.userTeamId;
              const playoffLine = view === 'League' ? -1 : 8;
              return (
                <tr key={s.teamId} className={`${isUser ? 'bg-ice-accent/10' : ''} ${i + 1 === playoffLine ? 'border-b-2 border-b-ice-accent/40' : ''}`}>
                  <td className="text-ice-muted">{i + 1}</td>
                  <td className="font-medium">
                    <span className="mr-1.5 inline-block w-9 rounded px-1 text-center text-[10px] font-bold"
                      style={{ backgroundColor: team.primaryColor, color: team.secondaryColor }}>{team.abbrev}</span>
                    {team.city}
                  </td>
                  <td>{s.gamesPlayed}</td>
                  <td>{s.wins}</td>
                  <td>{s.regulationLosses}</td>
                  <td>{s.otLosses}</td>
                  <td className="font-bold">{s.points}</td>
                  <td>{s.regulationWins}</td>
                  <td>{s.goalsFor}</td>
                  <td>{s.goalsAgainst}</td>
                  <td className={s.goalsFor - s.goalsAgainst >= 0 ? 'text-ice-good' : 'text-ice-bad'}>
                    {s.goalsFor - s.goalsAgainst >= 0 ? '+' : ''}{s.goalsFor - s.goalsAgainst}
                  </td>
                  <td className="font-mono text-xs">{last10(s)}</td>
                  <td className="font-mono text-xs">{s.streak ? `${s.streak.type}${s.streak.count}` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function last10(s: TeamStanding): string {
  const w = s.last10.filter((r) => r === 'W').length;
  const l = s.last10.filter((r) => r === 'L').length;
  const o = s.last10.filter((r) => r === 'O').length;
  return `${w}-${l}-${o}`;
}
