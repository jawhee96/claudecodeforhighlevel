import { NextRequest, NextResponse } from 'next/server'
import type { MetaRow } from '@/lib/types'

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

  const url = new URL('https://connectors.windsor.ai/facebook_ads')
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('date_from', from)
  url.searchParams.set('date_to', to)
  url.searchParams.set('fields', 'campaign_name,spend,clicks,impressions,date,actions_lead')

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
    const data: MetaRow[] = (json.data ?? []).map((r: Record<string, unknown>) => ({
      campaign: String(r.campaign_name ?? r.campaign ?? ''),
      spend: Number(r.spend) || 0,
      clicks: Number(r.clicks) || 0,
      impressions: Number(r.impressions) || 0,
      leads: Number(r.actions_lead) || 0,
      date: String(r.date ?? ''),
    }))
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Failed to reach Windsor.ai' }, { status: 502 })
  }
}
