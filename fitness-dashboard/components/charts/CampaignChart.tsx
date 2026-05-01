'use client'

import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'
import { aggregateByCampaign } from '@/lib/utils'
import type { MetaRow } from '@/lib/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const COLORS = ['#6366f1','#8b5cf6','#22c55e','#f59e0b','#ec4899','#14b8a6','#f97316','#64748b']

export default function CampaignChart({ meta }: { meta: MetaRow[] }) {
  const camps = aggregateByCampaign(meta)

  return (
    <Bar
      data={{
        labels: camps.map(([n]) => (n.length > 40 ? n.slice(0, 40) + '…' : n)),
        datasets: [{
          label: 'Spend',
          data: camps.map(([, d]) => Math.round(d.spend)),
          backgroundColor: camps.map((_, i) => COLORS[i % COLORS.length]),
          borderRadius: 4,
          borderSkipped: false,
        }],
      }}
      options={{
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ' $' + ctx.parsed.x.toLocaleString() } } },
        scales: {
          x: {
            ticks: { color: '#4a5568', font: { size: 10 }, callback: v => '$' + v },
            grid: { color: 'rgba(255,255,255,0.04)' },
          },
          y: { ticks: { color: '#8892a4', font: { size: 11 } }, grid: { display: false } },
        },
      }}
    />
  )
}
