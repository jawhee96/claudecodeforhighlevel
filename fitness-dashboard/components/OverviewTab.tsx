import KpiCard from './KpiCard'
import SpendChart from './charts/SpendChart'
import { fmt$, fmtK, crmStats, bookingStats } from '@/lib/utils'
import type { MetaRow, CrmRow, BookingRow } from '@/lib/types'

const LOCS = [
  { key: 'RD' as const, name: 'Red Deer', prefix: 'RD', cls: 'rd' },
  { key: 'SP' as const, name: 'Sherwood Park', prefix: 'SP', cls: 'sp' },
]

interface Props { meta: MetaRow[]; crm: CrmRow[]; bookings: BookingRow[] }

export default function OverviewTab({ meta, crm, bookings }: Props) {
  const totalSpend  = meta.reduce((s, r) => s + r.spend, 0)
  const totalClicks = meta.reduce((s, r) => s + r.clicks, 0)
  const totalLeads  = meta.reduce((s, r) => s + r.leads, 0)
  const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0
  const avgCpl = totalLeads  > 0 ? totalSpend / totalLeads  : 0
  const { won, wonRev, closeRate } = crmStats(crm)
  const { active: activeBookings, bookingRate, costPerBooking } = bookingStats(bookings, meta)

  return (
    <div className="tab-content">
      <div className="kpi-grid">
        <KpiCard label="Total ad spend"    value={fmt$(totalSpend)}                                sub="All campaigns" />
        <KpiCard label="Total leads"       value={totalLeads.toLocaleString()}                    sub="From Meta pixel" />
        <KpiCard label="Consults booked"   value={String(activeBookings.length)}                  sub="Via OnceHub" />
        <KpiCard label="Booking rate"      value={totalLeads > 0 ? bookingRate.toFixed(1) + '%' : '—'} sub="Bookings ÷ leads" />
        <KpiCard label="Cost per booking"  value={activeBookings.length > 0 ? fmt$(costPerBooking) : '—'} sub="Spend ÷ bookings" />
        <KpiCard label="Cost per lead"     value={totalLeads > 0 ? '$' + avgCpl.toFixed(2) : '—'} sub="Spend ÷ leads" />
        <KpiCard label="Avg CPC"           value={'$' + avgCpc.toFixed(2)}                        sub="Cost per click" />
        <KpiCard label="Pipeline won"      value={fmtK(wonRev)}   sub="Closed revenue"  valueClass="kpi-pos" />
        <KpiCard label="Close rate"        value={won.length > 0 ? closeRate + '%' : '—'} sub="Won ÷ total opps" />
      </div>

      <div className="section-label">By location</div>
      <div className="loc-grid">
        {LOCS.map(loc => {
          const locMeta     = meta.filter(r => r.campaign.startsWith(loc.prefix))
          const locSpend    = locMeta.reduce((s, r) => s + r.spend, 0)
          const locLeads    = locMeta.reduce((s, r) => s + r.leads, 0)
          const locBookings = bookings.filter(b => b.location === loc.key && b.status !== 'cancelled')
          const locCpl      = locLeads > 0 ? (locSpend / locLeads).toFixed(2) : null
          const locCpb      = locBookings.length > 0 ? fmt$(locSpend / locBookings.length) : '—'
          const locBkRate   = locLeads > 0 ? (locBookings.length / locLeads * 100).toFixed(1) + '%' : '—'
          const locCrm      = crm.filter(r => r.location === loc.key)
          const locWon      = locCrm.filter(r => r.status === 'won')
          const locOpen     = locCrm.filter(r => r.status === 'open')
          const locWonRev   = locWon.reduce((s, r) => s + r.value, 0)
          return (
            <div key={loc.key} className={`loc-card ${loc.cls}`}>
              <div className="loc-name">{loc.name}</div>
              <div className="loc-row"><span className="loc-row-lbl">Ad spend</span><span className="loc-row-val">{fmt$(locSpend)}</span></div>
              <div className="loc-row"><span className="loc-row-lbl">Leads</span><span className="loc-row-val">{locLeads}</span></div>
              <div className="loc-row"><span className="loc-row-lbl">Consults booked</span><span className="loc-row-val">{locBookings.length}</span></div>
              <div className="loc-row"><span className="loc-row-lbl">Booking rate</span><span className="loc-row-val">{locBkRate}</span></div>
              <div className="loc-row"><span className="loc-row-lbl">Cost per booking</span><span className="loc-row-val">{locCpb}</span></div>
              <div className="loc-row"><span className="loc-row-lbl">Cost per lead</span><span className="loc-row-val">{locCpl ? '$' + locCpl : '—'}</span></div>
              <div className="loc-row"><span className="loc-row-lbl">Pipeline won</span><span className="loc-row-val kpi-pos">{fmtK(locWonRev)}</span></div>
              <div className="loc-row"><span className="loc-row-lbl">Open opps</span><span className="loc-row-val">{locOpen.length}</span></div>
            </div>
          )
        })}
      </div>

      <div className="section-label">Daily ad spend</div>
      <div className="chart-wrap" style={{ height: 230 }}>
        <SpendChart meta={meta} />
      </div>
    </div>
  )
}
