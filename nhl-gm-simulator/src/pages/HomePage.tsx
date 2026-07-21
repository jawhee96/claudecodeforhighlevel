import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Trash2, Copy, Upload, Download } from 'lucide-react';
import type { FranchiseSummary } from '@/types';
import {
  listFranchises, deleteFranchise, duplicateFranchise,
  loadFranchise, exportFranchiseJson, importFranchiseJson,
} from '@/services/persistence/db';
import { useFranchiseStore } from '@/state/franchiseStore';
import { formatDate } from '@/components/Layout';

export function HomePage() {
  const [saves, setSaves] = useState<FranchiseSummary[]>([]);
  const navigate = useNavigate();
  const setFranchise = useFranchiseStore((s) => s.setFranchise);
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    setSaves(await listFranchises());
  }
  useEffect(() => {
    void refresh();
  }, []);

  async function play(id: string) {
    const f = await loadFranchise(id);
    if (f) {
      setFranchise(f);
      navigate('/game');
    }
  }

  async function onExport(id: string) {
    const f = await loadFranchise(id);
    if (!f) return;
    const blob = new Blob([exportFranchiseJson(f)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${f.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await importFranchiseJson(text);
    await refresh();
    e.target.value = '';
  }

  return (
    <div className="min-h-screen bg-ice-bg px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">NHL GM Simulator</h1>
          <p className="mt-1 text-ice-muted">
            Manage an NHL franchise as General Manager. Offline-first · July 20, 2026 snapshot ·
            <span className="text-ice-warn"> estimated data</span>.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={() => navigate('/new')}>
            <Plus size={16} /> New Franchise
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> Import Save
          </button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImportFile} />
        </div>

        <div className="card">
          <div className="card-head">Saved Franchises</div>
          {saves.length === 0 ? (
            <div className="px-4 py-10 text-center text-ice-muted">
              No franchises yet. Create a new one to begin.
            </div>
          ) : (
            <ul className="divide-y divide-ice-border">
              {saves.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1">
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-xs text-ice-muted">
                      {s.userTeamAbbrev} · {formatDate(s.currentDate)} · saved {new Date(s.updatedAt).toLocaleString()}
                    </div>
                  </div>
                  <button className="btn btn-primary px-2 py-1" onClick={() => play(s.id)}>
                    <Play size={14} /> Play
                  </button>
                  <button className="btn px-2 py-1" title="Export" onClick={() => onExport(s.id)}>
                    <Download size={14} />
                  </button>
                  <button className="btn px-2 py-1" title="Duplicate" onClick={async () => { await duplicateFranchise(s.id); await refresh(); }}>
                    <Copy size={14} />
                  </button>
                  <button className="btn px-2 py-1 hover:border-ice-bad hover:text-ice-bad" title="Delete"
                    onClick={async () => { if (confirm(`Delete "${s.name}"?`)) { await deleteFranchise(s.id); await refresh(); } }}>
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-6 text-xs text-ice-muted">
          NHL team names, player names and related marks belong to their respective rights holders.
          This prototype ships fictional, procedurally generated players — no copyrighted rosters or logos are bundled.
        </p>
      </div>
    </div>
  );
}
