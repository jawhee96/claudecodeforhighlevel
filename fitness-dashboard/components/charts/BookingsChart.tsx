'use client'

import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { dailyBookings } from '@/lib/utils'
import type { BookingRow } from '@/lib/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function BookingsChart({ bookings }: { bookings: BookingRow[] }) {
  const { days, rd, sp } = dailyBookings(bookings)

  return (
    <Bar
      data={{
        labels: days.map(d => d.slice(5)),
        datasets: [
          {
            label: 'Red Deer',
            data: rd,
            backgroundColor: 'rgba(99,102,241,0.75)',
            hoverBackgroundColor: '#6366f1',
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: 'Sherwood Park',
            data: sp,
            backgroundColor: 'rgba(139,92,246,0.75)',
            hoverBackgroundColor: '#8b5cf6',
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: { color: '#8892a4', font: { size: 12 }, boxWidth: 10, boxHeight: 10, borderRadius: 2, useBorderRadius: true },
          },
        },
        scales: {
          x: {
            stacked: true,
            ticks: { color: '#4a5568', font: { size: 10 }, maxRotation: 45, autoSkip: true, maxTicksLimit: 15 },
            grid: { color: 'rgba(255,255,255,0.04)' },
          },
          y: {
            stacked: true,
            ticks: { color: '#4a5568', font: { size: 10 }, stepSize: 1 },
            grid: { color: 'rgba(255,255,255,0.04)' },
          },
        },
      }}
    />
  )
}
