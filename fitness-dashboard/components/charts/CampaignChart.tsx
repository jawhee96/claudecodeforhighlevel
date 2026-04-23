'use client'

import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js'
import { aggregateByCampaign } from '@/lib/utils'
import type { MetaRow } from '@/lib/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const COLORS = ['#185FA5', '#1D9E75', '#BA7517', '#D4537E', '#534AB7', '#D85A30', '#639922', '#888']

export default function CampaignChart({ meta }: { meta: MetaRow[] }) {
  const camps = aggregateByCampaign(meta)

  return (
    <Bar
      data={{
        labels: camps.map(([n]) => (n.length > 38 ? n.slice(0, 38) + '…' : n)),
        datasets: [{ label: 'Spend', data: camps.map(([, d]) => Math.round(d.spend)), backgroundColor: COLORS }],
      }}
      options={{
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { callback: v => '$' + v, font: { size: 10 } } },
          y: { ticks: { font: { size: 11 } } },
        },
      }}
    />
  )
}
