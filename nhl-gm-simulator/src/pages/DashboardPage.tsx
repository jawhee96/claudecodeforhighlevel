import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { useFranchiseStore } from '@/state/franchiseStore';
import { computeCapSummary, money } from '@/engine/salaryCap';
import { computePlayoffPicture, sortStandings, isInPlayoffs } from '@/engine/standings';
import { formatDate } from '@/components/Layout';
import { isSkaterStats } from '@/utils/format';
import type { SkaterStatLine } from '@/types';

export function DashboardPage() {
  const f = useFranchiseStore((s) => s.franchise)!;
  const lastStop = useFranchiseStore((s) => s.lastStopReason);

  const userTeam = f.teams.find((t) => t.id === f.userTeamId)!;
  const standing = f.standings.find((s) => s.teamId === f.userTeamId)!;
  const cap = useMemo(() => computeCapSummary(f.userTeamId, f.players, f.contracts, f.seasonStartYear), [f]);

  const picture = useMemo(() => computePlayoffPicture(f.standings, f.teams), [f]);
  const inPlayoffs = isInPlayoffs(f.userTeamId, picture);

  const confRank = useMemo(() => {
    const conf = userTeam.conference;
    const sorted = sortStandings(f.standings.filter((s) => f.teams.find((t) => t.id === s.teamId)?.conference === conf));
    return sorted.findIndex((s) => s.teamId === f.userTeamId) + 1;
  }, [f, userTeam]);

  const divRank = useMemo(() => {
    const div = userTeam.division;
    const sorted = sortStandings(f.standings.filter((s) => f.teams.find((t) => t.id === s.teamId)?.division === div));
    return sorted.findIndex((s) => s.teamId === f.userTeamId) + 1;
  }, [f, userTeam]);

  const upcoming = f.schedule
    .filter((g) => !g.played && (g.homeTeamId === f.userTeamId || g.awayTeamId === f.userTeamId) && g.date >= f.currentDate)
    .slice(0, 5);

  const recent = f.schedule
    .filter((g) => g.played && (g.homeTeamId === f.userTeamId || g.awayTeamId === f.userTeamId))
    .slice(-5)
    .reverse();

  const leaders = useMemo(() => {
    const skaters = f.players
      .filter((p) => p.currentTeamId === f.userTeamId && isSkaterStats(p))
      .map((p) => ({ p, st: p.regularSeasonStats as SkaterStatLine }))
      .filter((x) => x.st.gamesPlayed > 0)
      .sort((a, b) => b.st.points - a.st.points)
      .slice(0, 5);
    return skaters;
  }, [f]);

  const urgent = f.inbox.filter((m) => !m.read && !m.archived && (m.priority === 'urgent' || m.priority === 'high')).slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">GM Office</h1>
          <p className="text-sm text-ice-muted">{formatDate(f.currentDate)} · {userTeam.city} {userTeam.name}</p>
        </div>
      </div>

      {lastStop && (
        <div className="flex items-center gap-2 rounded-lg border border-ice-warn/40 bg-ice-warn/10 px-4 py-2 text-sm text-ice-warn">
          <AlertTriangle size={16} /> Simulation paused: {lastStop}
        </div>
      )}

      {/* Snapshot tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        <Tile label="Record" value={`${standing.wins}-${standing.regulationLosses}-${standing.otLosses}`} />
        <Tile label="Points" value={String(standing.points)} />
        <Tile label="Div Rank" value={divRank ? `#${divRank}` : '—'} />
        <Tile label="Conf Rank" value={confRank ? `#${confRank}` : '—'} />
        <Tile label="Goal Diff" value={`${standing.goalsFor - standing.goalsAgainst >= 0 ? '+' : ''}${standing.goalsFor - standing.goalsAgainst}`} />
        <Tile label="Playoffs" value={inPlayoffs ? 'IN' : 'OUT'} tone={inPlayoffs ? 'good' : 'bad'} />
        <Tile label="Morale" value={`${f.teamMorale}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Upcoming */}
        <div className="card">
          <div className="card-head">Upcoming Schedule</div>
          <div className="p-1">
            {upcoming.length === 0 ? <Empty text="No games scheduled" /> : upcoming.map((g) => {
              const home = g.homeTeamId === f.userTeamId;
              const oppId = home ? g.awayTeamId : g.homeTeamId;
              const opp = f.teams.find((t) => t.id === oppId)!;
              return (
                <div key={g.id} className="flex items-center justify-between px-3 py-1.5 text-sm">
                  <span className="text-ice-muted">{formatDate(g.date).replace(/, \d+$/, '')}</span>
                  <span>{home ? 'vs' : '@'} <span className="font-semibold">{opp.abbrev}</span></span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent */}
        <div className="card">
          <div className="card-head">Recent Results</div>
          <div className="p-1">
            {recent.length === 0 ? <Empty text="No games played yet" /> : recent.map((g) => {
              const r = g.result!;
              const home = g.homeTeamId === f.userTeamId;
              const us = home ? r.homeGoals : r.awayGoals;
              const them = home ? r.awayGoals : r.homeGoals;
              const won = r.winnerTeamId === f.userTeamId;
              const oppId = home ? g.awayTeamId : g.homeTeamId;
              const opp = f.teams.find((t) => t.id === oppId)!;
              return (
                <div key={g.id} className="flex items-center justify-between px-3 py-1.5 text-sm">
                  <span className={`badge ${won ? 'bg-ice-good/15 text-ice-good' : 'bg-ice-bad/15 text-ice-bad'}`}>{won ? 'W' : 'L'}</span>
                  <span className="font-mono">{us}-{them}{r.endedIn !== 'REG' ? ` (${r.endedIn})` : ''}</span>
                  <span className="text-ice-muted">{home ? 'vs' : '@'} {opp.abbrev}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cap snapshot */}
        <div className="card">
          <div className="card-head">Cap Snapshot</div>
          <div className="space-y-1.5 p-3 text-sm">
            <Row label="Cap Hit" value={money(cap.activeCapHit)} />
            <Row label="Cap Space" value={money(cap.capSpace)} tone={cap.overCap ? 'bad' : 'good'} />
            <Row label="Contracts" value={`${cap.contractCount} / 50`} />
            <Row label="Active Roster" value={`${cap.activeRosterCount}`} />
            <Link to="/game/cap" className="mt-1 inline-block text-xs text-ice-accent hover:underline">Full cap dashboard →</Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Leaders */}
        <div className="card">
          <div className="card-head"><span>Team Leaders</span><TrendingUp size={15} className="text-ice-muted" /></div>
          <div className="p-1">
            {leaders.length === 0 ? <Empty text="Play games to see leaders" /> : (
              <table className="w-full table-compact">
                <thead><tr><th>Player</th><th>GP</th><th>G</th><th>A</th><th>P</th></tr></thead>
                <tbody>
                  {leaders.map(({ p, st }) => (
                    <tr key={p.id}>
                      <td className="font-medium">{p.fullName} <span className="text-xs text-ice-muted">{p.position}</span></td>
                      <td>{st.gamesPlayed}</td><td>{st.goals}</td><td>{st.assists}</td><td className="font-semibold">{st.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Inbox */}
        <div className="card">
          <div className="card-head"><span>Priority Inbox</span><Link to="/game/inbox" className="text-xs font-normal text-ice-accent hover:underline">Open →</Link></div>
          <div className="p-1">
            {urgent.length === 0 ? <Empty text="No urgent messages" /> : urgent.map((m) => (
              <Link key={m.id} to="/game/inbox" className="block px-3 py-1.5 text-sm hover:bg-ice-panel2/60">
                <div className="flex items-center gap-2">
                  <span className={`badge ${m.priority === 'urgent' ? 'bg-ice-bad/15 text-ice-bad' : 'bg-ice-warn/15 text-ice-warn'}`}>{m.category}</span>
                  <span className="font-medium">{m.subject}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  return (
    <div className="stat-tile">
      <div className="text-xs uppercase tracking-wide text-ice-muted">{label}</div>
      <div className={`mt-0.5 text-lg font-bold ${tone === 'good' ? 'text-ice-good' : tone === 'bad' ? 'text-ice-bad' : ''}`}>{value}</div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  return (
    <div className="flex justify-between">
      <span className="text-ice-muted">{label}</span>
      <span className={`font-mono ${tone === 'good' ? 'text-ice-good' : tone === 'bad' ? 'text-ice-bad' : ''}`}>{value}</span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="px-3 py-6 text-center text-sm text-ice-muted">{text}</div>;
}
