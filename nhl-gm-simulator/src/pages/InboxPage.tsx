import { useState } from 'react';
import { Archive, Mail, MailOpen } from 'lucide-react';
import { useFranchiseStore } from '@/state/franchiseStore';
import { formatDate } from '@/components/Layout';
import type { InboxCategory } from '@/types';

const CATEGORY_TONE: Partial<Record<InboxCategory, string>> = {
  Urgent: 'bg-ice-bad/15 text-ice-bad',
  Medical: 'bg-ice-bad/15 text-ice-bad',
  Owner: 'bg-ice-accent/15 text-ice-accent',
  Trade: 'bg-ice-warn/15 text-ice-warn',
  Team: 'bg-ice-muted/15 text-ice-muted',
};

export function InboxPage() {
  const f = useFranchiseStore((s) => s.franchise)!;
  const markRead = useFranchiseStore((s) => s.markRead);
  const archive = useFranchiseStore((s) => s.archiveMessage);
  const [selected, setSelected] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const messages = f.inbox.filter((m) => (showArchived ? m.archived : !m.archived));
  const active = f.inbox.find((m) => m.id === selected);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Inbox</h1>
        <label className="flex items-center gap-1.5 text-sm text-ice-muted">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="accent-ice-accent" />
          Show archived
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <div className="card overflow-hidden">
          <div className="max-h-[70vh] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-ice-muted">No messages.</div>
            ) : messages.map((m) => (
              <button key={m.id}
                onClick={() => { setSelected(m.id); if (!m.read) markRead(m.id); }}
                className={`flex w-full items-start gap-2 border-b border-ice-border/60 px-3 py-2 text-left hover:bg-ice-panel2/60 ${selected === m.id ? 'bg-ice-panel2' : ''}`}>
                {m.read ? <MailOpen size={15} className="mt-0.5 shrink-0 text-ice-muted" /> : <Mail size={15} className="mt-0.5 shrink-0 text-ice-accent" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`badge ${CATEGORY_TONE[m.category] ?? 'bg-ice-muted/15 text-ice-muted'}`}>{m.category}</span>
                    <span className="truncate text-xs text-ice-muted">{formatDate(m.date).replace(/, \d+$/, '')}</span>
                  </div>
                  <div className={`truncate text-sm ${m.read ? 'text-ice-muted' : 'font-semibold'}`}>{m.subject}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          {active ? (
            <div className="p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">{active.subject}</div>
                  <div className="text-xs text-ice-muted">From {active.sender} · {formatDate(active.date)}</div>
                </div>
                {!active.archived && (
                  <button className="btn px-2 py-1" onClick={() => { archive(active.id); setSelected(null); }}>
                    <Archive size={14} /> Archive
                  </button>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ice-text/90">{active.body}</p>
            </div>
          ) : (
            <div className="flex h-full min-h-[300px] items-center justify-center text-sm text-ice-muted">
              Select a message to read.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
