'use client'

import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'
import { dailySpend } from '@/lib/utils'
import type { MetaRow } from '@/lib/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

export default function SpendChart({ meta }: { meta: MetaRow[] }) {
  const { days, values } = dailySpend(meta)

  return (
    <Bar
      data={{
        labels: days.map(d => d.slice(5)),
        datasets: [{
          label: 'Daily spend',
          data: values,
          backgroundColor: 'rgba(99,102,241,0.7)',
          hoverBackgroundColor: '#6366f1',
          borderRadius: 4,
          borderSkipped: false,
        }],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ' $' + ctx.parsed.y.toLocaleString() } } },
        scales: {
          x: {
            ticks: { color: '#4a5568', font: { size: 10 }, maxRotation: 45, autoSkip: true, maxTicksLimit: 15 },
            grid: { color: 'rgba(255,255,255,0.04)' },
          },
          y: {
            ticks: { color: '#4a5568', font: { size: 10 }, callback: v => '$' + v },
            grid: { color: 'rgba(255,255,255,0.04)' },
          },
        },
      }}
    />
  )
}
