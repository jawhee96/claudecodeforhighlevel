import { NextRequest, NextResponse } from 'next/server'
import type { BookingRow, Location } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''

  const apiKey = process.env.ONCEHUB_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ONCEHUB_API_KEY is not configured. Add it to your .env.local file.' },
      { status: 500 }
    )
  }

  const rdPageIds = (process.env.ONCEHUB_RD_PAGE_IDS ?? '').split(',').filter(Boolean)
  const spPageIds = (process.env.ONCEHUB_SP_PAGE_IDS ?? '').split(',').filter(Boolean)
  const rdLabel = process.env.GHL_RD_LOCATION ?? 'Red Deer'
  const spLabel = process.env.GHL_SP_LOCATION ?? 'Sherwood Park'

  const url = new URL('https://api.oncehub.com/v2/bookings')
  url.searchParams.set('starting_at', from + 'T00:00:00Z')
  url.searchParams.set('ending_at', to + 'T23:59:59Z')
  url.searchParams.set('status', 'scheduled,rescheduled,completed,no_show')
  url.searchParams.set('limit', '100')

  try {
    const res = await fetch(url.toString(), {
      headers: { 'API-KEY': apiKey, 'Content-Type': 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return NextResponse.json(
        { error: `OnceHub returned ${res.status}${body ? ': ' + body.slice(0, 200) : ''}` },
        { status: res.status }
      )
    }
    const json = await res.json()

    const data: BookingRow[] = (json.data ?? []).map((r: Record<string, unknown>) => {
      const page = (r.booking_page ?? {}) as Record<string, string>
      const pageId = page.id ?? ''
      const pageLabel = page.label ?? ''

      let location: Location = 'RD'
      if (rdPageIds.length > 0 || spPageIds.length > 0) {
        if (spPageIds.includes(pageId)) location = 'SP'
        else if (rdPageIds.includes(pageId)) location = 'RD'
      } else {
        const lbl = pageLabel.toLowerCase()
        if (lbl.includes(spLabel.toLowerCase()) || lbl.includes('sherwood')) location = 'SP'
        else if (lbl.includes(rdLabel.toLowerCase()) || lbl.includes('red deer')) location = 'RD'
      }

      const startingTime = String(r.starting_time ?? '')
      const date = startingTime ? startingTime.slice(0, 10) : from

      return {
        id: String(r.id ?? ''),
        status: String(r.status ?? 'scheduled') as BookingRow['status'],
        location,
        date,
        bookingPage: pageLabel,
      }
    })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Failed to reach OnceHub' }, { status: 502 })
  }
}
