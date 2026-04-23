import type { MetaRow, CrmRow } from './types'

export const fmt$ = (n: number) => '$' + Math.round(n).toLocaleString()
export const fmtK = (n: number) =>
  n >= 1000 ? '$' + (n / 1000).toFixed(1) + 'k' : fmt$(n)

export function getDefaultDateRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10)
  const to = now.toISOString().slice(0, 10)
  return { from, to }
}

export function aggregateByCampaign(rows: MetaRow[]) {
  const map: Record<string, { spend: number; clicks: number; impressions: number; leads: number }> = {}
  for (const r of rows) {
    if (!map[r.campaign]) map[r.campaign] = { spend: 0, clicks: 0, impressions: 0, leads: 0 }
    map[r.campaign].spend += r.spend
    map[r.campaign].clicks += r.clicks
    map[r.campaign].impressions += r.impressions
    map[r.campaign].leads += r.leads
  }
  return Object.entries(map).sort((a, b) => b[1].spend - a[1].spend)
}

export function dailySpend(rows: MetaRow[]) {
  const map: Record<string, number> = {}
  for (const r of rows) map[r.date] = (map[r.date] ?? 0) + r.spend
  const days = Object.keys(map).sort()
  return { days, values: days.map(d => Math.round(map[d])) }
}

export function crmStats(rows: CrmRow[]) {
  const won = rows.filter(r => r.status === 'won')
  const open = rows.filter(r => r.status === 'open')
  const lost = rows.filter(r => r.status === 'lost')
  return {
    won,
    open,
    lost,
    wonRev: won.reduce((s, r) => s + r.value, 0),
    pipeVal: open.reduce((s, r) => s + r.value, 0),
    closeRate: rows.length > 0 ? (won.length / rows.length * 100).toFixed(1) : '0.0',
  }
}
