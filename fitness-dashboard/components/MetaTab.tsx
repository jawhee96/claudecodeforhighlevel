import CampaignChart from './charts/CampaignChart'
import { fmt$, aggregateByCampaign } from '@/lib/utils'
import type { MetaRow } from '@/lib/types'

export default function MetaTab({ meta }: { meta: MetaRow[] }) {
  const camps = aggregateByCampaign(meta)

  return (
    <>
      <div className="section-label">Campaign performance</div>
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #ebebeb', padding: '1rem', marginBottom: '1rem', overflowX: 'auto' }}>
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
                  <td>{name}</td>
                  <td className="r">{fmt$(d.spend)}</td>
                  <td className="r">{d.clicks.toLocaleString()}</td>
                  <td className="r">{cpc}</td>
                  <td className="r">{ctr}</td>
                  <td className="r">{d.leads}</td>
                  <td className="r">{cpl}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="section-label">Spend by campaign</div>
      <div className="chart-wrap" style={{ height: camps.length * 42 + 60 }}>
        <CampaignChart meta={meta} />
      </div>
    </>
  )
}
