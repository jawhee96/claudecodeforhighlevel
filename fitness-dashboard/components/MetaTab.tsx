import CampaignChart from './charts/CampaignChart'
import { fmt$, aggregateByCampaign } from '@/lib/utils'
import type { MetaRow } from '@/lib/types'

export default function MetaTab({ meta }: { meta: MetaRow[] }) {
  const camps = aggregateByCampaign(meta)
  const totalSpend  = meta.reduce((s, r) => s + r.spend, 0)
  const totalClicks = meta.reduce((s, r) => s + r.clicks, 0)
  const totalLeads  = meta.reduce((s, r) => s + r.leads, 0)

  return (
    <div className="tab-content">
      <div className="section-label">Campaign performance</div>
      <div className="chart-wrap" style={{ padding: '1rem', marginBottom: '1rem', overflowX: 'auto' }}>
        <table className="camp-table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th className="r">Spend</th>
              <th className="r">Clicks</th>
              <th className="r">CPC</th>
              <th className="r">CTR</th>
              <th className="r">Leads</th>
              <th className="r">CPL</th>
            </tr>
          </thead>
          <tbody>
            {camps.map(([name, d]) => {
              const cpc = d.clicks > 0 ? '$' + (d.spend / d.clicks).toFixed(2) : '—'
              const ctr = d.impressions > 0 ? (d.clicks / d.impressions * 100).toFixed(2) + '%' : '—'
              const cpl = d.leads > 0 ? '$' + (d.spend / d.leads).toFixed(2) : '—'
              return (
                <tr key={name}>
                  <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</td>
                  <td className="r">{fmt$(d.spend)}</td>
                  <td className="r">{d.clicks.toLocaleString()}</td>
                  <td className="r">{cpc}</td>
                  <td className="r" style={{ color: 'var(--text-2)' }}>{ctr}</td>
                  <td className="r">{d.leads}</td>
                  <td className="r">{cpl}</td>
                </tr>
              )
            })}
            <tr style={{ fontWeight: 700 }}>
              <td style={{ color: 'var(--text-2)', fontSize: 11, paddingTop: 12 }}>TOTAL</td>
              <td className="r" style={{ paddingTop: 12 }}>{fmt$(totalSpend)}</td>
              <td className="r" style={{ paddingTop: 12 }}>{totalClicks.toLocaleString()}</td>
              <td className="r" style={{ paddingTop: 12 }}>{totalClicks > 0 ? '$' + (totalSpend / totalClicks).toFixed(2) : '—'}</td>
              <td className="r" style={{ paddingTop: 12 }}>—</td>
              <td className="r" style={{ paddingTop: 12 }}>{totalLeads}</td>
              <td className="r" style={{ paddingTop: 12 }}>{totalLeads > 0 ? '$' + (totalSpend / totalLeads).toFixed(2) : '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="section-label">Spend by campaign</div>
      <div className="chart-wrap" style={{ height: Math.max(camps.length * 44 + 60, 200) }}>
        <CampaignChart meta={meta} />
      </div>
    </div>
  )
}
