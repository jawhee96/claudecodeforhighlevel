'use client'

import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
import type { CrmRow } from '@/lib/types'

ChartJS.register(ArcElement, Tooltip)

const SLICES = [
  { key: 'won',  label: 'Won',  color: '#22c55e' },
  { key: 'open', label: 'Open', color: '#6366f1' },
  { key: 'lost', label: 'Lost', color: '#ef4444' },
] as const

export default function CrmDoughnut({ crm }: { crm: CrmRow[] }) {
  const counts = SLICES.map(s => crm.filter(r => r.status === s.key).length)

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '2.5rem' }}>
      <div style={{ width: 200, height: 200, position: 'relative', flexShrink: 0 }}>
        <Doughnut
          data={{
            labels: SLICES.map(s => s.label),
            datasets: [{ data: counts, backgroundColor: SLICES.map(s => s.color), borderWidth: 0, hoverOffset: 6 }],
          }}
          options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '68%' }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SLICES.map((s, i) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-2)', minWidth: 36 }}>{s.label}</span>
            <strong style={{ fontSize: 16, color: 'var(--text-1)' }}>{counts[i]}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}
