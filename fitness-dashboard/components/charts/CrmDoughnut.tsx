'use client'

import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
import type { CrmRow } from '@/lib/types'

ChartJS.register(ArcElement, Tooltip)

const SLICES = [
  { key: 'won', label: 'Won', color: '#1a7a4a' },
  { key: 'open', label: 'Open', color: '#2980b9' },
  { key: 'lost', label: 'Lost', color: '#c0392b' },
] as const

export default function CrmDoughnut({ crm }: { crm: CrmRow[] }) {
  const counts = SLICES.map(s => crm.filter(r => r.status === s.key).length)

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ width: 220, height: 220, position: 'relative' }}>
        <Doughnut
          data={{
            labels: SLICES.map(s => s.label),
            datasets: [{ data: counts, backgroundColor: SLICES.map(s => s.color), borderWidth: 0 }],
          }}
          options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
        />
      </div>
      <div style={{ marginLeft: '2rem', fontSize: '13px' }}>
        {SLICES.map((s, i) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, background: s.color, display: 'inline-block' }} />
            <span style={{ color: '#999' }}>{s.label}</span>
            <strong>{counts[i]}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}
