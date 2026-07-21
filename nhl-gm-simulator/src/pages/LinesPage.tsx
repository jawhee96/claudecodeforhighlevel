import { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { useFranchiseStore } from '@/state/franchiseStore';
import { autoLines, lineChemistry } from '@/engine/lines';
import type { Player } from '@/types';

export function LinesPage() {
  const f = useFranchiseStore((s) => s.franchise)!;
  const setLines = useFranchiseStore((s) => s.setLines);
  const lines = f.lines[f.userTeamId];
  const byId = useMemo(() => new Map(f.players.map((p) => [p.id, p])), [f]);

  function name(id: string | null): Player | undefined {
    return id ? byId.get(id) : undefined;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Lines</h1>
        <button className="btn" onClick={() => setLines(f.userTeamId, autoLines(f.userTeamId, f.players))}>
          <RefreshCw size={14} /> Auto-generate
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="card-head">Forward Lines</div>
          <div className="p-2">
            {lines.forwardLines.map((line, i) => (
              <Unit key={i} label={`Line ${i + 1}`} ids={line} name={name} chem={lineChemistry(line, f.players)} />
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head">Defense Pairs</div>
          <div className="p-2">
            {lines.defensePairs.map((pair, i) => (
              <Unit key={i} label={`Pair ${i + 1}`} ids={pair} name={name} chem={lineChemistry(pair, f.players)} />
            ))}
          </div>
          <div className="card-head border-t">Goaltending</div>
          <div className="p-2">
            <Unit label="Starter" ids={[lines.starter]} name={name} />
            <Unit label="Backup" ids={[lines.backup]} name={name} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="card-head">Power Play 1</div>
          <div className="flex flex-wrap gap-2 p-3">
            {lines.powerPlay1.map((id) => <Chip key={id} p={name(id)} />)}
          </div>
        </div>
        <div className="card">
          <div className="card-head">Penalty Kill 1</div>
          <div className="flex flex-wrap gap-2 p-3">
            {lines.penaltyKill1.map((id) => <Chip key={id} p={name(id)} />)}
          </div>
        </div>
      </div>
      <p className="text-xs text-ice-muted">
        Drag-and-drop line editing is planned; auto-generation builds a valid depth chart the sim uses immediately.
      </p>
    </div>
  );
}

function Unit({ label, ids, name, chem }: {
  label: string;
  ids: (string | null)[];
  name: (id: string | null) => Player | undefined;
  chem?: number;
}) {
  return (
    <div className="mb-1.5 flex items-center gap-2 rounded border border-ice-border/60 bg-ice-panel2/40 px-2 py-1.5">
      <span className="w-14 shrink-0 text-xs uppercase tracking-wide text-ice-muted">{label}</span>
      <div className="flex flex-1 flex-wrap gap-1.5">
        {ids.map((id, i) => <Chip key={i} p={name(id)} />)}
      </div>
      {chem !== undefined && (
        <span className={`badge ${chem >= 70 ? 'bg-ice-good/15 text-ice-good' : chem >= 50 ? 'bg-ice-warn/15 text-ice-warn' : 'bg-ice-bad/15 text-ice-bad'}`}>
          {chem}
        </span>
      )}
    </div>
  );
}

function Chip({ p }: { p: Player | undefined }) {
  if (!p) return <span className="rounded bg-ice-bg px-2 py-1 text-xs text-ice-muted">empty</span>;
  return (
    <span className="rounded bg-ice-bg px-2 py-1 text-xs">
      <span className="font-medium">{p.lastName}</span>{' '}
      <span className="text-ice-muted">{p.position} · {p.overall}</span>
    </span>
  );
}
