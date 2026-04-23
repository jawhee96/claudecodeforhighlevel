'use client'

import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js'
import { dailySpend } from '@/lib/utils'
import type { MetaRow } from '@/lib/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

export default function SpendChart({ meta }: { meta: MetaRow[] }) {
  const { days, values } = dailySpend(meta)

  return (
    <Bar
      data={{
        labels: days.map(d => d.slice(5)),
        datasets: [{ label: 'Daily spend', data: values, backgroundColor: '#185FA5', borderRadius: 3 }],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { font: { size: 10 }, maxRotation: 45, autoSkip: true, maxTicksLimit: 15 } },
          y: { ticks: { callback: v => '$' + v, font: { size: 10 } } },
        },
      }}
    />
  )
}
