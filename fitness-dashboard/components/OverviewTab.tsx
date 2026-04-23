import KpiCard from './KpiCard'
import SpendChart from './charts/SpendChart'
import { fmt$, fmtK, crmStats } from '@/lib/utils'
import type { MetaRow, CrmRow } from '@/lib/types'

const LOCS = [
  { key: 'RD' as const, name: 'Red Deer', prefix: 'RD' },
  { key: 'SP' as const, name: 'Sherwood Park', prefix: 'SP' },
]

interface Props { meta: MetaRow[]; crm: CrmRow[] }

export default function OverviewTab({ meta, crm }: Props) {
  const totalSpend = meta.reduce((s, r) => s + r.spend, 0)
  const totalClicks = meta.reduce((s, r) => s + r.clicks, 0)
  const totalLeads = meta.reduce((s, r) => s + r.leads, 0)
  const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0
  const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0
  const { won, wonRev, closeRate } = crmStats(crm)

  return (
    <>
      <div className="kpi-grid">
        <KpiCard label="Total ad spend" value={fmt$(totalSpend)} sub="All campaigns" />
        <KpiCard label="Total clicks" value={totalClicks.toLocaleString()} sub="Across all campaigns" />
        <KpiCard label="Avg CPC" value={'$' + avgCpc.toFixed(2)} sub="Cost per click" />
        <KpiCard label="Total leads" value={totalLeads.toLocaleString()} sub="From Meta pixel" />
        <KpiCard label="Cost per lead" value={totalLeads > 0 ? '$' + avgCpl.toFixed(2) : '—'} sub="Spend ÷ leads" />
        <KpiCard label="Pipeline won" value={fmtK(wonRev)} sub="Closed revenue" valueClass="kpi-pos" />
        <KpiCard label="Close rate" value={won.length > 0 ? closeRate + '%' : '—'} sub="Won ÷ total opps" />
      </div>

      <div className="section-label">By location</div>
      <div className="loc-grid">
        {LOCS.map(loc => {
          const locMeta = meta.filter(r => r.campaign.startsWith(loc.prefix))
          const locSpend = locMeta.reduce((s, r) => s + r.spend, 0)
          const locLeads = locMeta.reduce((s, r) => s + r.leads, 0)
          const locCpl = locLeads > 0 ? (locSpend / locLeads).toFixed(2) : null
          const locCrm = crm.filter(r => r.location === loc.key)
          const locWon = locCrm.filter(r => r.status === 'won')
          const locOpen = locCrm.filter(r => r.status === 'open')
          const locWonRev = locWon.reduce((s, r) => s + r.value, 0)
          return (
            <div key={loc.key} className="loc-card">
              <div className="loc-name">{loc.name}</div>
              <div className="loc-row"><span className="loc-row-lbl">Ad spend</span><span className="loc-row-val">{fmt$(locSpend)}</span></div>
              <div className="loc-row"><span className="loc-row-lbl">Leads</span><span className="loc-row-val">{locLeads}</span></div>
              <div className="loc-row"><span className="loc-row-lbl">Cost per lead</span><span className="loc-row-val">{locCpl ? '$' + locCpl : '—'}</span></div>
              <div className="loc-row"><span className="loc-row-lbl">Pipeline won</span><span className="loc-row-val kpi-pos">{fmtK(locWonRev)}</span></div>
              <div className="loc-row"><span className="loc-row-lbl">Open opps</span><span className="loc-row-val">{locOpen.length}</span></div>
            </div>
          )
        })}
      </div>

      <div className="section-label">Daily ad spend</div>
      <div className="chart-wrap" style={{ height: 220 }}>
        <SpendChart meta={meta} />
      </div>
    </>
  )
}
