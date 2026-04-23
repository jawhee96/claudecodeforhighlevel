export default function MindbodyTab() {
  return (
    <>
      <div className="mb-placeholder">
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
        <p><strong>Mindbody live data — pending activation</strong></p>
        <p style={{ fontSize: '12px' }}>
          Live access request submitted. Once approved (1–2 business days), add your
          Site IDs and API key to activate revenue, appointments, memberships, and
          visit data for both locations.
        </p>
        <button className="connect-btn">Connect Mindbody when ready</button>
      </div>

      <div className="section-label" style={{ marginTop: '1.5rem' }}>
        Placeholder KPIs — awaiting live connection
      </div>
      <div className="kpi-grid">
        {['Monthly revenue', 'Active members', 'Appts today', 'Revenue / member', 'New clients (Apr)', 'Churn rate'].map(label => (
          <div key={label} className="kpi">
            <div className="kpi-label">{label}</div>
            <div className="kpi-val" style={{ color: '#ccc' }}>—</div>
          </div>
        ))}
      </div>
    </>
  )
}
