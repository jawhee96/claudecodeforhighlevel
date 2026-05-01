import KpiCard from './KpiCard'
import BookingsChart from './charts/BookingsChart'
import { fmt$, bookingStats } from '@/lib/utils'
import type { MetaRow, BookingRow } from '@/lib/types'

const LOCS = [
  { key: 'RD' as const, name: 'Red Deer', prefix: 'RD', cls: 'rd' },
  { key: 'SP' as const, name: 'Sherwood Park', prefix: 'SP', cls: 'sp' },
]

const STATUS_ORDER: BookingRow['status'][] = ['completed','scheduled','rescheduled','no_show','cancelled']

interface Props { bookings: BookingRow[]; meta: MetaRow[] }

export default function BookingsTab({ bookings, meta }: Props) {
  const { active, bookingRate, costPerBooking } = bookingStats(bookings, meta)
  const totalLeads = meta.reduce((s, r) => s + r.leads, 0)
  const totalSpend = meta.reduce((s, r) => s + r.spend, 0)

  const statusCounts = STATUS_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = bookings.filter(b => b.status === s).length
    return acc
  }, {})

  return (
    <div className="tab-content">
      <div className="kpi-grid">
        <KpiCard label="Total bookings"   value={String(active.length)}                              sub="Excl. cancelled" />
        <KpiCard label="Booking rate"     value={totalLeads > 0 ? bookingRate.toFixed(1) + '%' : '—'} sub="Bookings ÷ leads" />
        <KpiCard label="Cost per booking" value={active.length > 0 ? fmt$(costPerBooking) : '—'}      sub="Total spend ÷ bookings" />
        <KpiCard label="Total leads"      value={String(totalLeads)}                                  sub="From Meta pixel" />
        <KpiCard label="Total ad spend"   value={fmt$(totalSpend)}                                    sub="All campaigns" />
        <KpiCard label="Completed"        value={String(statusCounts.completed)}                      sub="Consults held"      valueClass={statusCounts.completed > 0 ? 'kpi-pos' : undefined} />
        <KpiCard label="No-shows"         value={String(statusCounts.no_show)}                        sub="Missed consults"    valueClass={statusCounts.no_show > 0 ? 'kpi-neg' : undefined} />
      </div>

      <div className="section-label">By location</div>
      <div className="loc-grid">
        {LOCS.map(loc => {
          const locMeta     = meta.filter(r => r.campaign.startsWith(loc.prefix))
          const locSpend    = locMeta.reduce((s, r) => s + r.spend, 0)
          const locLeads    = locMeta.reduce((s, r) => s + r.leads, 0)
          const locBookings = bookings.filter(b => b.location === loc.key && b.status !== 'cancelled')
          const locCpb      = locBookings.length > 0 ? fmt$(locSpend / locBookings.length) : '—'
          const locBkRate   = locLeads > 0 ? (locBookings.length / locLeads * 100).toFixed(1) + '%' : '—'
          const locCompleted = bookings.filter(b => b.location === loc.key && b.status === 'completed').length
          const locNoShow    = bookings.filter(b => b.location === loc.key && b.status === 'no_show').length
          const showRate     = locBookings.length > 0
            ? ((locCompleted / locBookings.length) * 100).toFixed(0) + '%'
            : '—'
          return (
            <div key={loc.key} className={`loc-card ${loc.cls}`}>
              <div className="loc-name">{loc.name}</div>
              <div className="loc-row"><span className="loc-row-lbl">Bookings</span><span className="loc-row-val">{locBookings.length}</span></div>
              <div className="loc-row"><span className="loc-row-lbl">Booking rate</span><span className="loc-row-val">{locBkRate}</span></div>
              <div className="loc-row"><span className="loc-row-lbl">Cost per booking</span><span className="loc-row-val">{locCpb}</span></div>
              <div className="loc-row"><span className="loc-row-lbl">Completed</span><span className="loc-row-val kpi-pos">{locCompleted}</span></div>
              <div className="loc-row"><span className="loc-row-lbl">No-shows</span><span className="loc-row-val kpi-neg">{locNoShow}</span></div>
              <div className="loc-row"><span className="loc-row-lbl">Show rate</span><span className="loc-row-val">{showRate}</span></div>
              <div className="loc-row"><span className="loc-row-lbl">Ad spend</span><span className="loc-row-val">{fmt$(locSpend)}</span></div>
              <div className="loc-row"><span className="loc-row-lbl">Leads</span><span className="loc-row-val">{locLeads}</span></div>
            </div>
          )
        })}
      </div>

      <div className="section-label">Daily bookings by location</div>
      <div className="chart-wrap" style={{ height: 230 }}>
        <BookingsChart bookings={bookings} />
      </div>

      <div className="section-label">Booking status breakdown</div>
      <div className="chart-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', paddingBottom: '1.25rem' }}>
        {STATUS_ORDER.map(s => {
          const count = statusCounts[s]
          const pct = bookings.length > 0 ? (count / bookings.length * 100).toFixed(0) : '0'
          const barColor = s === 'completed' ? '#22c55e'
            : s === 'scheduled'   ? '#6366f1'
            : s === 'rescheduled' ? '#f59e0b'
            : s === 'no_show'     ? '#ef4444'
            : '#4a5568'
          return (
            <div key={s} style={{ minWidth: 120, flex: '1 1 120px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-2)', textTransform: 'capitalize' }}>{s.replace('_', ' ')}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{count} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>({pct}%)</span></span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: pct + '%', background: barColor, borderRadius: 3, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
