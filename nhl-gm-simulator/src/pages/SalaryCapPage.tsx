import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { useFranchiseStore } from '@/state/franchiseStore';
import { computeCapSummary, money } from '@/engine/salaryCap';

export function SalaryCapPage() {
  const f = useFranchiseStore((s) => s.franchise)!;
  const cap = useMemo(() => computeCapSummary(f.userTeamId, f.players, f.contracts, f.seasonStartYear), [f]);
  const byId = useMemo(() => new Map(f.players.map((p) => [p.id, p])), [f]);

  const teamContracts = useMemo(
    () => f.contracts.filter((c) => byId.get(c.playerId)?.currentTeamId === f.userTeamId),
    [f, byId],
  );

  // Multi-year commitment chart.
  const commitment = useMemo(() => {
    const data: { season: string; committed: number }[] = [];
    for (let s = f.seasonStartYear; s < f.seasonStartYear + 6; s++) {
      const committed = teamContracts.filter((c) => s >= c.startSeason && s <= c.endSeason).reduce((sum, c) => sum + c.aav, 0);
      data.push({ season: `${s}-${(s + 1) % 100}`, committed: Math.round(committed / 1_000_000) });
    }
    return data;
  }, [teamContracts, f.seasonStartYear]);

  const pct = Math.min(100, (cap.activeCapHit / cap.capUpperLimit) * 100);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Salary Cap Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Cap Upper Limit" value={money(cap.capUpperLimit)} />
        <Tile label="Active Cap Hit" value={money(cap.activeCapHit)} />
        <Tile label="Cap Space" value={money(cap.capSpace)} tone={cap.overCap ? 'bad' : 'good'} />
        <Tile label="Cap Floor" value={money(cap.capLowerLimit)} tone={cap.belowFloor ? 'warn' : undefined} />
      </div>

      {/* Cap usage bar */}
      <div className="card p-4">
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-ice-muted">Cap Usage</span>
          <span className="font-mono">{money(cap.activeCapHit)} / {money(cap.capUpperLimit)}</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-ice-panel2">
          <div className={`h-full ${cap.overCap ? 'bg-ice-bad' : pct > 92 ? 'bg-ice-warn' : 'bg-ice-good'}`} style={{ width: `${pct}%` }} />
        </div>
        {cap.messages.length > 0 && (
          <ul className="mt-2 space-y-0.5 text-xs text-ice-warn">
            {cap.messages.map((m, i) => <li key={i}>⚠ {m}</li>)}
          </ul>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="card">
          <div className="card-head">Multi-Year Commitment (AAV in $M)</div>
          <div className="h-64 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={commitment}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3242" />
                <XAxis dataKey="season" stroke="#8b95a7" fontSize={12} />
                <YAxis stroke="#8b95a7" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161b22', border: '1px solid #2a3242', borderRadius: 8 }}
                  formatter={(v: number) => [`$${v}M`, 'Committed']}
                />
                <ReferenceLine y={Math.round(cap.capUpperLimit / 1_000_000)} stroke="#f87171" strokeDasharray="4 4" />
                <Bar dataKey="committed" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-head">Roster & Contract Limits</div>
          <div className="space-y-2 p-3 text-sm">
            <Row label="Active Roster" value={`${cap.activeRosterCount} / 23`} />
            <Row label="Contracts Used" value={`${cap.contractCount} / 50`} />
            <Row label="Roster Valid" value={cap.rosterValid ? 'Yes' : 'No'} tone={cap.rosterValid ? 'good' : 'bad'} />
            <div className="border-t border-ice-border pt-2 text-xs text-ice-muted">
              Cap figures reflect reported 2026-27 limits and are marked estimated.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' | 'warn' }) {
  const color = tone === 'good' ? 'text-ice-good' : tone === 'bad' ? 'text-ice-bad' : tone === 'warn' ? 'text-ice-warn' : '';
  return (
    <div className="stat-tile">
      <div className="text-xs uppercase tracking-wide text-ice-muted">{label}</div>
      <div className={`mt-0.5 text-lg font-bold ${color}`}>{value}</div>
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
