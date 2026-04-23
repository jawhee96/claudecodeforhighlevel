import { NextRequest, NextResponse } from 'next/server'
import type { CrmRow, Status, Location } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''

  const apiKey = process.env.WINDSOR_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'WINDSOR_API_KEY is not configured. Add it to your .env.local file.' },
      { status: 500 }
    )
  }

  const rdName = process.env.GHL_RD_LOCATION ?? 'Red Deer'
  const spName = process.env.GHL_SP_LOCATION ?? 'Sherwood Park'

  const url = new URL('https://connectors.windsor.ai/gohighlevel')
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('date_from', from)
  url.searchParams.set('date_to', to)
  // Adjust field names if your Windsor.ai GHL connector uses different names
  url.searchParams.set('fields', 'opportunity_status,opportunity_value,location_name')

  try {
    const res = await fetch(url.toString(), { cache: 'no-store' })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return NextResponse.json(
        { error: `Windsor.ai returned ${res.status}${body ? ': ' + body.slice(0, 200) : ''}` },
        { status: res.status }
      )
    }
    const json = await res.json()

    const VALID_STATUSES = new Set(['won', 'open', 'lost'])

    const data: CrmRow[] = (json.data ?? []).map((r: Record<string, unknown>) => {
      const rawStatus = String(r.opportunity_status ?? 'open').toLowerCase()
      const status: Status = VALID_STATUSES.has(rawStatus)
        ? (rawStatus as Status)
        : 'open'

      const locRaw = String(r.location_name ?? r.pipeline_name ?? '')
      const location: Location =
        locRaw === rdName || locRaw.toLowerCase().includes('red deer')
          ? 'RD'
          : locRaw === spName || locRaw.toLowerCase().includes('sherwood')
          ? 'SP'
          : 'RD'

      return {
        status,
        value: Number(r.opportunity_value) || 0,
        location,
      }
    })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Failed to reach Windsor.ai' }, { status: 502 })
  }
}
