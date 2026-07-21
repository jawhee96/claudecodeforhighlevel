import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import {
  Home, Inbox, Users, LayoutGrid, Calendar, ListOrdered, BarChart3,
  FileText, DollarSign, Database, Settings, ChevronRight, Loader2,
} from 'lucide-react';
import { useFranchiseStore } from '@/state/franchiseStore';
import { computeCapSummary, money } from '@/engine/salaryCap';
import { SimControls } from './SimControls';

const NAV = [
  { to: '/game', label: 'Home', icon: Home, end: true },
  { to: '/game/inbox', label: 'Inbox', icon: Inbox },
  { to: '/game/roster', label: 'Roster', icon: Users },
  { to: '/game/lines', label: 'Lines', icon: LayoutGrid },
  { to: '/game/schedule', label: 'Schedule', icon: Calendar },
  { to: '/game/standings', label: 'Standings', icon: ListOrdered },
  { to: '/game/statistics', label: 'Statistics', icon: BarChart3 },
  { to: '/game/contracts', label: 'Contracts', icon: FileText },
  { to: '/game/cap', label: 'Salary Cap', icon: DollarSign },
  { to: '/game/database', label: 'Database', icon: Database },
  { to: '/game/settings', label: 'Settings', icon: Settings },
];

export function Layout() {
  const franchise = useFranchiseStore((s) => s.franchise);
  const sim = useFranchiseStore((s) => s.sim);
  const navigate = useNavigate();

  useEffect(() => {
    if (!franchise) navigate('/');
  }, [franchise, navigate]);

  const userTeam = franchise?.teams.find((t) => t.id === franchise.userTeamId);
  const standing = franchise?.standings.find((s) => s.teamId === franchise.userTeamId);
  const unread = franchise?.inbox.filter((m) => !m.read && !m.archived).length ?? 0;

  const cap = useMemo(() => {
    if (!franchise) return null;
    return computeCapSummary(franchise.userTeamId, franchise.players, franchise.contracts, franchise.seasonStartYear);
  }, [franchise]);

  if (!franchise || !userTeam) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-ice-bg text-ice-text">
      {/* Sidebar */}
      <aside className="flex w-52 shrink-0 flex-col border-r border-ice-border bg-ice-panel">
        <div className="flex items-center gap-2 border-b border-ice-border px-4 py-3">
          <span
            className="flex h-8 w-8 items-center justify-center rounded font-bold"
            style={{ backgroundColor: userTeam.primaryColor, color: userTeam.secondaryColor }}
          >
            {userTeam.abbrev.slice(0, 3)}
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold">{userTeam.city}</div>
            <div className="text-xs text-ice-muted">{userTeam.name}</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? 'border-l-2 border-ice-accent bg-ice-panel2 text-ice-accent'
                    : 'border-l-2 border-transparent text-ice-muted hover:bg-ice-panel2/60 hover:text-ice-text'
                }`
              }
            >
              <item.icon size={16} />
              <span className="flex-1">{item.label}</span>
              {item.label === 'Inbox' && unread > 0 && (
                <span className="badge bg-ice-accent/20 text-ice-accent">{unread}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-ice-border px-4 py-2 text-[10px] text-ice-muted">
          Estimated data · v0.1 · offline
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center gap-4 border-b border-ice-border bg-ice-panel px-4 py-2">
          <div className="flex items-center gap-1.5 text-sm">
            <Calendar size={15} className="text-ice-muted" />
            <span className="font-mono font-medium">{formatDate(franchise.currentDate)}</span>
          </div>
          <div className="hidden items-center gap-4 text-sm sm:flex">
            <TopStat label="Record" value={standing ? `${standing.wins}-${standing.regulationLosses}-${standing.otLosses}` : '0-0-0'} />
            <TopStat label="Pts" value={standing ? String(standing.points) : '0'} />
            <TopStat label="Cap Space" value={cap ? money(cap.capSpace) : '—'} tone={cap && cap.overCap ? 'bad' : 'good'} />
            <TopStat label="Owner" value={`${franchise.ownerConfidence}%`} />
          </div>
          <div className="ml-auto flex items-center gap-3">
            {sim.running && <Loader2 size={16} className="animate-spin text-ice-accent" />}
            <SimControls />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function TopStat({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-xs uppercase tracking-wide text-ice-muted">{label}</span>
      <span className={`font-mono font-semibold ${tone === 'bad' ? 'text-ice-bad' : tone === 'good' ? 'text-ice-good' : ''}`}>
        {value}
      </span>
    </div>
  );
}

export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export { ChevronRight };
