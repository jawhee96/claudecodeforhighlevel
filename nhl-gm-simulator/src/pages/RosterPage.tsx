import { useMemo, useState } from 'react';
import { useFranchiseStore } from '@/state/franchiseStore';
import { money } from '@/engine/salaryCap';
import { isSkaterStats, statusTone, savePct, gaa } from '@/utils/format';
import type { GoalieStatLine, Player, SkaterStatLine } from '@/types';
import { isGoalie } from '@/types';

type SortKey = 'name' | 'pos' | 'ovr' | 'age' | 'pts' | 'cap';

export function RosterPage() {
  const f = useFranchiseStore((s) => s.franchise)!;
  const [sort, setSort] = useState<SortKey>('ovr');
  const contractById = useMemo(() => new Map(f.contracts.map((c) => [c.id, c])), [f]);

  const roster = useMemo(() => {
    const list = f.players.filter((p) => p.currentTeamId === f.userTeamId);
    const cap = (p: Player) => (p.contractId ? contractById.get(p.contractId)?.aav ?? 0 : 0);
    const pts = (p: Player) => (isSkaterStats(p) ? (p.regularSeasonStats as SkaterStatLine).points : 0);
    return list.sort((a, b) => {
      switch (sort) {
        case 'name': return a.lastName.localeCompare(b.lastName);
        case 'pos': return a.position.localeCompare(b.position);
        case 'age': return a.age - b.age;
        case 'pts': return pts(b) - pts(a);
        case 'cap': return cap(b) - cap(a);
        default: return b.overall - a.overall;
      }
    });
  }, [f, sort, contractById]);

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Roster</h1>
      <div className="card overflow-x-auto">
        <table className="w-full table-compact">
          <thead>
            <tr>
              <Th onClick={() => setSort('name')}>Player</Th>
              <Th onClick={() => setSort('pos')}>Pos</Th>
              <Th>Shoots</Th>
              <Th onClick={() => setSort('age')}>Age</Th>
              <Th onClick={() => setSort('ovr')}>OVR</Th>
              <Th>POT</Th>
              <Th>Archetype</Th>
              <Th>Status</Th>
              <Th onClick={() => setSort('pts')}>Stats</Th>
              <Th onClick={() => setSort('cap')}>Cap Hit</Th>
              <Th>Data</Th>
            </tr>
          </thead>
          <tbody>
            {roster.map((p) => {
              const c = p.contractId ? contractById.get(p.contractId) : undefined;
              return (
                <tr key={p.id} className={p.injury ? 'opacity-60' : ''}>
                  <td className="font-medium">{p.fullName}{p.injury && <span className="ml-1 text-xs text-ice-bad">INJ</span>}</td>
                  <td>{p.position}</td>
                  <td className="text-ice-muted">{p.shootsCatches}</td>
                  <td>{p.age}</td>
                  <td className="font-mono font-semibold">{maskRating(p.overall, p.scoutingConfidence)}</td>
                  <td className="font-mono text-ice-muted">{maskRating(p.potential, p.scoutingConfidence)}</td>
                  <td className="text-ice-muted">{p.archetype}</td>
                  <td><span className="badge bg-ice-muted/15 text-ice-muted">{p.rosterStatus}</span></td>
                  <td className="font-mono text-xs">{statLine(p)}</td>
                  <td className="font-mono">{c ? money(c.aav) : '—'}</td>
                  <td><span className={`badge ${statusTone(p.dataStatus)}`}>{p.dataStatus}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ice-muted">
        Ratings are shown as ranges when scouting confidence is low. All values are estimated in this snapshot.
      </p>
    </div>
  );
}

function statLine(p: Player): string {
  if (isGoalie(p)) {
    const g = p.regularSeasonStats as GoalieStatLine;
    if (g.gamesPlayed === 0) return '—';
    return `${g.wins}-${g.losses}-${g.otLosses} · ${savePct(g)} · ${gaa(g)}`;
  }
  const s = p.regularSeasonStats as SkaterStatLine;
  if (s.gamesPlayed === 0) return '—';
  return `${s.goals}G ${s.assists}A ${s.points}P`;
}

/** With low scouting confidence, show a range instead of an exact rating. */
function maskRating(value: number, confidence: number): string {
  if (confidence >= 85) return String(value);
  const spread = confidence >= 65 ? 3 : 6;
  return `${Math.max(1, value - spread)}–${Math.min(99, value + spread)}`;
}

function Th({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <th className={onClick ? 'cursor-pointer select-none hover:text-ice-text' : ''} onClick={onClick}>{children}</th>;
}
