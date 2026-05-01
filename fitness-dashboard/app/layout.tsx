import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '360 Fitness — Business Dashboard',
  description: 'Live business dashboard for 360 Fitness — Red Deer & Sherwood Park',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
