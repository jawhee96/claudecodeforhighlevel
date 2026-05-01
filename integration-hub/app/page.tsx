export default function HomePage() {
  const integrations = [
    {
      from: "Mindbody",
      to: "HighLevel",
      color: "#7c3aed",
      endpoint: "/api/webhooks/mindbody",
      flows: [
        "New / updated client → HL contact upsert",
        "Membership purchase → tags + workflow trigger",
        "Client index change → risk/value tags",
        "Any purchase → purchase tags + workflow",
        "Client deactivated → mb-inactive tag",
      ],
    },
    {
      from: "HighLevel",
      to: "Mindbody",
      color: "#0891b2",
      endpoint: "/api/webhooks/highlevel",
      flows: [
        "Consultation appointment created → MB prospect + appointment booked",
        "Order / invoice paid → MB contact created/merged + service added",
      ],
    },
    {
      from: "Oncehub",
      to: "HighLevel",
      color: "#059669",
      endpoint: "/api/webhooks/oncehub",
      flows: [
        "Booking created → HL contact upsert + pipeline stage: Booked",
        "Booking rescheduled → pipeline stage: Rescheduled",
        "Booking cancelled → pipeline stage: Cancelled (opp lost)",
        "Booking completed → pipeline stage: Completed (opp won)",
        "No-show → pipeline stage: No Show",
      ],
    },
    {
      from: "Trainerize",
      to: "HighLevel",
      color: "#d97706",
      endpoint: "/api/webhooks/trainerize",
      flows: [
        "Subscription / purchase → HL contact upsert",
        "Plan → plan-specific tags applied",
        "Plan → workflow trigger (if configured)",
        "Subscription cancelled / expired → tz-cancelled / tz-expired tag",
      ],
    },
  ];

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>
          Integration Hub
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 15 }}>
          Webhook receiver — Mindbody · Trainerize · Oncehub ↔ HighLevel
        </p>
      </header>

      <div style={{ display: "grid", gap: 20 }}>
        {integrations.map((intg) => (
          <section
            key={`${intg.from}-${intg.to}`}
            style={{
              background: "#1a1a24",
              border: `1px solid ${intg.color}33`,
              borderRadius: 12,
              padding: "24px 28px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span
                style={{
                  background: intg.color,
                  color: "#fff",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {intg.from}
              </span>
              <span style={{ color: "#64748b", fontSize: 18 }}>→</span>
              <span
                style={{
                  background: "#1e293b",
                  color: "#cbd5e1",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 13,
                  fontWeight: 600,
                  border: "1px solid #334155",
                }}
              >
                {intg.to}
              </span>
              <code
                style={{
                  marginLeft: "auto",
                  fontSize: 12,
                  color: "#64748b",
                  background: "#0f0f13",
                  padding: "3px 8px",
                  borderRadius: 4,
                }}
              >
                POST {intg.endpoint}
              </code>
            </div>

            <ul style={{ listStyle: "none", display: "grid", gap: 6 }}>
              {intg.flows.map((flow) => (
                <li
                  key={flow}
                  style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, color: "#94a3b8" }}
                >
                  <span style={{ color: intg.color, marginTop: 1, flexShrink: 0 }}>✓</span>
                  {flow}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #1e293b" }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9", marginBottom: 12 }}>
          Setup checklist
        </h2>
        <ol style={{ listStyle: "decimal", paddingLeft: 20, display: "grid", gap: 6 }}>
          {[
            "Copy .env.local.example → .env.local and fill in all API keys",
            "Set HL_PIPELINE_ID + HL_STAGE_* env vars for Oncehub pipeline stages",
            "Set HL_WORKFLOW_* env vars for membership/purchase/coaching workflow IDs",
            "Set MB_SERVICE_* and HL_PRODUCT_* env vars for HL→MB product mapping",
            "Register each webhook URL in the respective platform dashboard",
            "Set SKIP_WEBHOOK_VERIFICATION=false and configure webhook secrets",
          ].map((step) => (
            <li key={step} style={{ color: "#94a3b8", fontSize: 14 }}>
              {step}
            </li>
          ))}
        </ol>
      </footer>
    </main>
  );
}
