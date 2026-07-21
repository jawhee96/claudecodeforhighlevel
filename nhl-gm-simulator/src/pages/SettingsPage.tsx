import { useNavigate } from 'react-router-dom';
import { Save, LogOut, Download } from 'lucide-react';
import { useFranchiseStore } from '@/state/franchiseStore';
import { exportFranchiseJson } from '@/services/persistence/db';

export function SettingsPage() {
  const f = useFranchiseStore((s) => s.franchise)!;
  const save = useFranchiseStore((s) => s.save);
  const setFranchise = useFranchiseStore((s) => s.setFranchise);
  const navigate = useNavigate();

  function exportSave() {
    const blob = new Blob([exportFranchiseJson(f)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${f.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-bold">Settings</h1>

      <div className="card">
        <div className="card-head">Franchise</div>
        <div className="space-y-1.5 p-3 text-sm">
          <Row label="Name" value={f.name} />
          <Row label="GM" value={`${f.gm.name} (${f.gm.philosophy})`} />
          <Row label="Schema Version" value={String(f.schemaVersion)} />
          <Row label="RNG State" value={String(f.rngState)} />
        </div>
      </div>

      <div className="card">
        <div className="card-head">Save & Exit</div>
        <div className="flex flex-wrap gap-2 p-3">
          <button className="btn btn-primary" onClick={async () => { await save(); alert('Franchise saved.'); }}>
            <Save size={14} /> Save Now
          </button>
          <button className="btn" onClick={exportSave}><Download size={14} /> Export JSON</button>
          <button className="btn" onClick={async () => { await save(); setFranchise(null); navigate('/'); }}>
            <LogOut size={14} /> Save & Main Menu
          </button>
        </div>
      </div>

      <p className="text-xs text-ice-muted">
        Autosave runs after every simulation batch. Saves are stored locally in your browser (IndexedDB) and never leave your machine.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-ice-muted">{label}</span><span className="font-mono">{value}</span></div>;
}
