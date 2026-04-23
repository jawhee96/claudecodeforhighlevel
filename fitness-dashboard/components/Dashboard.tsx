'use client'

import { useState, useEffect, useCallback } from 'react'
import { getDefaultDateRange } from '@/lib/utils'
import type { MetaRow, CrmRow } from '@/lib/types'
import OverviewTab from './OverviewTab'
import MetaTab from './MetaTab'
import CrmTab from './CrmTab'
import MindbodyTab from './MindbodyTab'

type Tab = 'overview' | 'meta' | 'crm' | 'mindbody'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'meta', label: 'Meta ads' },
  { id: 'crm', label: 'CRM pipeline' },
  { id: 'mindbody', label: 'Mindbody' },
]

export default function Dashboard() {
  const { from: defaultFrom, to: defaultTo } = getDefaultDateRange()
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [meta, setMeta] = useState<MetaRow[]>([])
  const [crm, setCrm] = useState<CrmRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [metaRes, crmRes] = await Promise.all([
        fetch(`/api/meta?from=${from}&to=${to}`),
        fetch(`/api/crm?from=${from}&to=${to}`),
      ])
      const [metaJson, crmJson] = await Promise.all([metaRes.json(), crmRes.json()])
      if (metaJson.error) throw new Error(`Meta Ads: ${metaJson.error}`)
      if (crmJson.error) throw new Error(`CRM: ${crmJson.error}`)
      setMeta(metaJson.data ?? [])
      setCrm(crmJson.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error fetching data')
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => { fetchData() }, [fetchData])

  const monthLabel = new Date(from + 'T00:00:00').toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="container">
      <div className="hdr">
        <div>
          <div className="hdr-title">360 Fitness — Business Dashboard</div>
          <div className="hdr-sub">
            {monthLabel} &middot; Red Deer &amp; Sherwood Park &middot; Live data
          </div>
        </div>
        <div className="hdr-controls">
          <input
            type="date"
            className="date-input"
            value={from}
            onChange={e => setFrom(e.target.value)}
            aria-label="Start date"
          />
          <span style={{ color: '#bbb', fontSize: '12px' }}>→</span>
          <input
            type="date"
            className="date-input"
            value={to}
            onChange={e => setTo(e.target.value)}
            aria-label="End date"
          />
          <button className="refresh-btn" onClick={fetchData} disabled={loading}>
            {loading ? '…' : 'Refresh'}
          </button>
          <span className={`badge${loading ? ' loading-badge' : ''}`}>
            {loading ? '⟳ Loading' : '● Live'}
          </span>
        </div>
      </div>

      {error && <div className="error-banner">⚠ {error}</div>}

      <div className="tab-row">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state">Loading Windsor.ai data…</div>
      ) : (
        <>
          {activeTab === 'overview' && <OverviewTab meta={meta} crm={crm} />}
          {activeTab === 'meta' && <MetaTab meta={meta} />}
          {activeTab === 'crm' && <CrmTab crm={crm} />}
          {activeTab === 'mindbody' && <MindbodyTab />}
        </>
      )}
    </div>
  )
}
