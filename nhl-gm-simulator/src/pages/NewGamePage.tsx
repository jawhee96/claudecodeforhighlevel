import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check } from 'lucide-react';
import type { GMProfile, ManagementPhilosophy, Team } from '@/types';
import { NHL_TEAMS } from '@/data/teams';
import { useFranchiseStore } from '@/state/franchiseStore';

const PHILOSOPHIES: ManagementPhilosophy[] = [
  'Balanced', 'Draft and Develop', 'Aggressive Contender', 'Rebuild Specialist',
  'Analytics-First', 'Player-First', 'Cap Strategist', 'Veteran-Focused',
];

function difficulty(team: Team): { label: string; tone: string } {
  const pts = team.lastSeasonRecord.wins * 2 + team.lastSeasonRecord.otLosses;
  if (pts >= 100) return { label: 'Contender', tone: 'text-ice-good' };
  if (pts >= 88) return { label: 'Playoff Bubble', tone: 'text-ice-warn' };
  if (pts >= 78) return { label: 'Retool', tone: 'text-ice-accent' };
  return { label: 'Rebuild', tone: 'text-ice-bad' };
}

export function NewGamePage() {
  const navigate = useNavigate();
  const newGame = useFranchiseStore((s) => s.newGame);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [gm, setGm] = useState<GMProfile>({
    name: 'Alex Morgan',
    age: 44,
    nationality: 'CAN',
    philosophy: 'Balanced',
    tradeAggressiveness: 50,
    analyticsPreference: 60,
    playerLoyalty: 55,
  });

  const grouped = groupByDivision(NHL_TEAMS);

  async function create() {
    if (!selected) return;
    setBusy(true);
    const franchiseName = `${NHL_TEAMS.find((t) => t.id === selected)!.city} — ${gm.name}`;
    await newGame({ name: franchiseName, userTeamId: selected, gm });
    setBusy(false);
    navigate('/game');
  }

  return (
    <div className="min-h-screen bg-ice-bg px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <button className="btn mb-4" onClick={() => navigate('/')}>
          <ChevronLeft size={16} /> Back
        </button>
        <h1 className="mb-1 text-2xl font-bold">New Franchise</h1>
        <p className="mb-6 text-sm text-ice-muted">
          Select a team, then set up your GM profile. 2025–26 records are estimated.
        </p>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Team selection */}
          <div className="space-y-6">
            {Object.entries(grouped).map(([division, teams]) => (
              <div key={division}>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ice-muted">{division}</h2>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {teams.map((team) => {
                    const diff = difficulty(team);
                    const active = selected === team.id;
                    return (
                      <button
                        key={team.id}
                        onClick={() => setSelected(team.id)}
                        className={`card relative p-3 text-left transition-colors ${active ? 'border-ice-accent ring-1 ring-ice-accent' : 'hover:border-ice-accent/60'}`}
                      >
                        {active && <Check size={16} className="absolute right-2 top-2 text-ice-accent" />}
                        <div className="flex items-center gap-2">
                          <span className="flex h-9 w-9 items-center justify-center rounded font-bold"
                            style={{ backgroundColor: team.primaryColor, color: team.secondaryColor }}>
                            {team.abbrev}
                          </span>
                          <div className="leading-tight">
                            <div className="text-sm font-semibold">{team.city}</div>
                            <div className="text-xs text-ice-muted">{team.name}</div>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="font-mono text-ice-muted">
                            {team.lastSeasonRecord.wins}-{team.lastSeasonRecord.losses}-{team.lastSeasonRecord.otLosses}
                          </span>
                          <span className={diff.tone}>{diff.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* GM profile */}
          <div className="card h-fit p-4 lg:sticky lg:top-4">
            <div className="mb-3 text-sm font-semibold">GM Profile</div>
            <label className="mb-3 block text-xs text-ice-muted">
              Name
              <input className="mt-1 w-full rounded border border-ice-border bg-ice-panel2 px-2 py-1.5 text-sm text-ice-text"
                value={gm.name} onChange={(e) => setGm({ ...gm, name: e.target.value })} />
            </label>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <label className="block text-xs text-ice-muted">
                Age
                <input type="number" className="mt-1 w-full rounded border border-ice-border bg-ice-panel2 px-2 py-1.5 text-sm text-ice-text"
                  value={gm.age} onChange={(e) => setGm({ ...gm, age: Number(e.target.value) })} />
              </label>
              <label className="block text-xs text-ice-muted">
                Nationality
                <input className="mt-1 w-full rounded border border-ice-border bg-ice-panel2 px-2 py-1.5 text-sm text-ice-text"
                  value={gm.nationality} onChange={(e) => setGm({ ...gm, nationality: e.target.value.toUpperCase().slice(0, 3) })} />
              </label>
            </div>
            <label className="mb-3 block text-xs text-ice-muted">
              Management Philosophy
              <select className="mt-1 w-full rounded border border-ice-border bg-ice-panel2 px-2 py-1.5 text-sm text-ice-text"
                value={gm.philosophy} onChange={(e) => setGm({ ...gm, philosophy: e.target.value as ManagementPhilosophy })}>
                {PHILOSOPHIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <Slider label="Trade Aggressiveness" value={gm.tradeAggressiveness} onChange={(v) => setGm({ ...gm, tradeAggressiveness: v })} />
            <Slider label="Analytics Preference" value={gm.analyticsPreference} onChange={(v) => setGm({ ...gm, analyticsPreference: v })} />
            <Slider label="Player Loyalty" value={gm.playerLoyalty} onChange={(v) => setGm({ ...gm, playerLoyalty: v })} />

            <button className="btn btn-primary mt-4 w-full justify-center" disabled={!selected || busy} onClick={create}>
              {busy ? 'Building league…' : selected ? 'Start Franchise' : 'Select a team'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="mb-3 block text-xs text-ice-muted">
      <span className="flex justify-between"><span>{label}</span><span className="font-mono text-ice-text">{value}</span></span>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-ice-accent" />
    </label>
  );
}

function groupByDivision(teams: Team[]): Record<string, Team[]> {
  const order = ['Atlantic', 'Metropolitan', 'Central', 'Pacific'];
  const out: Record<string, Team[]> = {};
  for (const div of order) out[div] = teams.filter((t) => t.division === div);
  return out;
}
