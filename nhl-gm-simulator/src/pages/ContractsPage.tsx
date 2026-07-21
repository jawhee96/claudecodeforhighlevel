import { useMemo } from 'react';
import { useFranchiseStore } from '@/state/franchiseStore';
import { money } from '@/engine/salaryCap';
import { statusTone } from '@/utils/format';

export function ContractsPage() {
  const f = useFranchiseStore((s) => s.franchise)!;
  const byId = useMemo(() => new Map(f.players.map((p) => [p.id, p])), [f]);

  const contracts = useMemo(() => {
    return f.contracts
      .filter((c) => byId.get(c.playerId)?.currentTeamId === f.userTeamId)
      .sort((a, b) => b.aav - a.aav);
  }, [f, byId]);

  const expiring = contracts.filter((c) => c.endSeason === f.seasonStartYear);

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Contracts</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="stat-tile"><div className="text-xs text-ice-muted">Total Contracts</div><div className="text-lg font-bold">{contracts.length}</div></div>
        <div className="stat-tile"><div className="text-xs text-ice-muted">Total AAV</div><div className="text-lg font-bold">{money(contracts.reduce((s, c) => s + c.aav, 0))}</div></div>
        <div className="stat-tile"><div className="text-xs text-ice-muted">Expiring ({f.seasonStartYear}-{f.seasonStartYear + 1})</div><div className="text-lg font-bold">{expiring.length}</div></div>
        <div className="stat-tile"><div className="text-xs text-ice-muted">NTC/NMC</div><div className="text-lg font-bold">{contracts.filter((c) => c.noTradeClause || c.noMovementClause).length}</div></div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full table-compact">
          <thead><tr>
            <th>Player</th><th>Pos</th><th>Type</th><th>AAV</th><th>Term</th><th>Through</th><th>Total</th><th>Clauses</th><th>Data</th>
          </tr></thead>
          <tbody>
            {contracts.map((c) => {
              const p = byId.get(c.playerId);
              const term = c.endSeason - c.startSeason + 1;
              return (
                <tr key={c.id}>
                  <td className="font-medium">{p?.fullName ?? c.playerId}</td>
                  <td>{p?.position ?? '—'}</td>
                  <td className="text-ice-muted">{c.type}</td>
                  <td className="font-mono font-semibold">{money(c.aav)}</td>
                  <td>{term}y</td>
                  <td className="text-ice-muted">{c.endSeason}-{(c.endSeason + 1) % 100}</td>
                  <td className="font-mono">{money(c.totalValue)}</td>
                  <td>
                    {c.noMovementClause ? <span className="badge bg-ice-bad/15 text-ice-bad">NMC</span>
                      : c.noTradeClause ? <span className="badge bg-ice-warn/15 text-ice-warn">NTC</span>
                        : <span className="text-ice-muted">—</span>}
                  </td>
                  <td><span className={`badge ${statusTone(c.dataStatus)}`}>{c.dataStatus}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
