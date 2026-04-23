import KpiCard from './KpiCard'
import CrmDoughnut from './charts/CrmDoughnut'
import { fmtK, crmStats } from '@/lib/utils'
import type { CrmRow } from '@/lib/types'

const LOCS = [
  { key: 'RD' as const, name: 'Red Deer' },
  { key: 'SP' as const, name: 'Sherwood Park' },
]

export default function CrmTab({ crm }: { crm: CrmRow[] }) {
  const { won, open, lost, wonRev, pipeVal, closeRate } = crmStats(crm)

  return (
    <>
      <div className="kpi-grid">
        <KpiCard label="Total opportunities" value={String(crm.length)} />
        <KpiCard label="Won" value={String(won.length)} valueClass="kpi-pos" />
        <KpiCard label="Open" value={String(open.length)} />
        <KpiCard label="Lost" value={String(lost.length)} valueClass="kpi-neg" />
        <KpiCard label="Won revenue" value={fmtK(wonRev)} valueClass="kpi-pos" />
        <KpiCard label="Pipeline value (open)" value={fmtK(pipeVal)} />
        <KpiCard label="Close rate" value={closeRate + '%'} sub="Won ÷ total opps" />
      </div>

      <div className="section-label">Funnel by location</div>
      <div className="loc-grid">
        {LOCS.map(loc => {
          const locCrm = crm.filter(r => r.location === loc.key)
          const locWon = locCrm.filter(r => r.status === 'won')
          const locOpen = locCrm.filter(r => r.status === 'open')
          const locLost = locCrm.filter(r => r.status === 'lost')
          const locWonRev = locWon.reduce((s, r) => s + r.value, 0)
          const maxCount = Math.max(locWon.length, locOpen.length, locLost.length) || 1
          const pct = (n: number) => ((n / maxCount) * 100).toFixed(0) + '%'
          return (
            <div key={loc.key} className="loc-card">
              <div className="loc-name">{loc.name}</div>
              <div className="funnel-row">
                <span className="funnel-lbl">Won</span>
                <div className="funnel-bar-bg"><div className="funnel-bar" style={{ width: pct(locWon.length), background: '#1a7a4a' }} /></div>
                <span className="funnel-count">{locWon.length}</span>
              </div>
              <div className="funnel-row">
                <span className="funnel-lbl">Open</span>
                <div className="funnel-bar-bg"><div className="funnel-bar" style={{ width: pct(locOpen.length), background: '#2980b9' }} /></div>
                <span className="funnel-count">{locOpen.length}</span>
              </div>
              <div className="funnel-row">
                <span className="funnel-lbl">Lost</span>
                <div className="funnel-bar-bg"><div className="funnel-bar" style={{ width: pct(locLost.length), background: '#c0392b' }} /></div>
                <span className="funnel-count">{locLost.length}</span>
              </div>
              <div className="loc-row" style={{ marginTop: 8 }}>
                <span className="loc-row-lbl">Won revenue</span>
                <span className="loc-row-val kpi-pos">{fmtK(locWonRev)}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="section-label">Pipeline status breakdown</div>
      <div className="chart-wrap" style={{ height: 260 }}>
        <CrmDoughnut crm={crm} />
      </div>
    </>
  )
}
