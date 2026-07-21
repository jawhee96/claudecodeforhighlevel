import { useMemo, useRef, useState } from 'react';
import { Download, Upload, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useFranchiseStore } from '@/state/franchiseStore';
import { validateDatabase } from '@/data/validation';
import { applyImport, SAMPLE_IMPORT, type ImportEnvelope } from '@/data/importSchema';
import { saveFranchise } from '@/services/persistence/db';
import { formatDate } from '@/components/Layout';

export function DatabaseStatusPage() {
  const f = useFranchiseStore((s) => s.franchise)!;
  const setFranchise = useFranchiseStore((s) => s.setFranchise);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const report = useMemo(
    () => validateDatabase({ teams: f.teams, players: f.players, contracts: f.contracts, schedule: f.schedule }),
    [f],
  );

  function downloadReport() {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation-report-${f.currentDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadSample() {
    const blob = new Blob([JSON.stringify(SAMPLE_IMPORT, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-import.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const env = JSON.parse(await file.text()) as ImportEnvelope;
      const result = applyImport({ players: f.players, contracts: f.contracts, teams: f.teams }, env);
      const updated = {
        ...f,
        players: result.players,
        contracts: result.contracts,
        snapshot: {
          ...f.snapshot,
          lastRosterUpdate: env.meta.snapshotDate ?? f.snapshot.lastRosterUpdate,
          sources: Array.from(new Set([...f.snapshot.sources, ...(env.meta.sources ?? [])])),
        },
      };
      await saveFranchise(updated);
      setFranchise(updated);
      setImportMsg(`Imported ${result.applied} records, skipped ${result.skipped}. ${result.warnings.length} warning(s).`);
    } catch (err) {
      setImportMsg(`Import failed: ${(err as Error).message}`);
    }
    e.target.value = '';
  }

  const errors = report.issues.filter((i) => i.severity === 'error');
  const warnings = report.issues.filter((i) => i.severity === 'warning');

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Database Status</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="card-head">Snapshot</div>
          <div className="space-y-1.5 p-3 text-sm">
            <Row label="Snapshot Date" value={f.snapshot.snapshotDate} />
            <Row label="Last Roster Update" value={f.snapshot.lastRosterUpdate} />
            <Row label="Last Contract Update" value={f.snapshot.lastContractUpdate} />
            <Row label="Last Transaction Update" value={f.snapshot.lastTransactionUpdate} />
            <Row label="Current In-Game Date" value={formatDate(f.currentDate)} />
            <div className="pt-1">
              <div className="text-ice-muted">Sources</div>
              <ul className="ml-4 list-disc text-xs text-ice-text/80">
                {f.snapshot.sources.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <p className="pt-1 text-xs text-ice-warn">{f.snapshot.notes}</p>
          </div>
        </div>

        <div className="card">
          <div className="card-head">Validation Summary</div>
          <div className="p-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Count label="Teams" value={report.counts.teams} />
              <Count label="Players" value={report.counts.players} />
              <Count label="Contracts" value={report.counts.contracts} />
              <Count label="Scheduled Games" value={report.counts.scheduledGames} />
              <Count label="Estimated Fields" value={report.counts.estimatedFields} tone="warn" />
              <Count label="Missing Fields" value={report.counts.missingFields} tone={report.counts.missingFields ? 'bad' : undefined} />
              <Count label="Errors" value={report.counts.errors} tone={report.counts.errors ? 'bad' : 'good'} />
              <Count label="Warnings" value={report.counts.warnings} tone={report.counts.warnings ? 'warn' : 'good'} />
            </div>
            <div className="mt-3 flex items-center gap-2">
              {report.counts.errors === 0
                ? <span className="flex items-center gap-1.5 text-sm text-ice-good"><CheckCircle2 size={16} /> No blocking errors</span>
                : <span className="flex items-center gap-1.5 text-sm text-ice-bad"><XCircle size={16} /> {report.counts.errors} error(s) found</span>}
              <button className="btn ml-auto px-2 py-1" onClick={downloadReport}><Download size={14} /> Report JSON</button>
            </div>
          </div>
        </div>
      </div>

      {/* Import */}
      <div className="card">
        <div className="card-head">Import Authorized Snapshot</div>
        <div className="space-y-2 p-3 text-sm">
          <p className="text-ice-muted">
            Load a JSON envelope to replace estimated values with real, authorized July 20, 2026 data.
            Imported fields are flagged <span className="text-ice-accent">user-edited</span>. Nothing is invented silently.
          </p>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={() => fileRef.current?.click()}><Upload size={14} /> Import JSON</button>
            <button className="btn" onClick={downloadSample}><Download size={14} /> Download Sample Format</button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImport} />
          </div>
          {importMsg && <p className="text-xs text-ice-good">{importMsg}</p>}
        </div>
      </div>

      {/* Issues */}
      {(errors.length > 0 || warnings.length > 0) && (
        <div className="card">
          <div className="card-head">Validation Issues ({report.issues.length})</div>
          <div className="max-h-72 overflow-y-auto p-2">
            {[...errors, ...warnings].slice(0, 200).map((issue, i) => (
              <div key={i} className="flex items-start gap-2 px-2 py-1 text-sm">
                {issue.severity === 'error'
                  ? <XCircle size={15} className="mt-0.5 shrink-0 text-ice-bad" />
                  : <AlertTriangle size={15} className="mt-0.5 shrink-0 text-ice-warn" />}
                <span className="text-ice-muted"><span className="font-mono text-xs">{issue.code}</span> — {issue.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-ice-muted">{label}</span><span className="font-mono">{value}</span></div>;
}

function Count({ label, value, tone }: { label: string; value: number; tone?: 'good' | 'bad' | 'warn' }) {
  const color = tone === 'good' ? 'text-ice-good' : tone === 'bad' ? 'text-ice-bad' : tone === 'warn' ? 'text-ice-warn' : '';
  return (
    <div className="rounded border border-ice-border bg-ice-panel2/40 px-2.5 py-1.5">
      <div className="text-xs text-ice-muted">{label}</div>
      <div className={`font-mono text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}
