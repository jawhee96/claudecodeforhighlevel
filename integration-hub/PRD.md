# Integration Hub — Product Requirements Document
**Version:** 0.1 (Draft for Review)
**Date:** May 2026

---

## 1. Executive Summary

This PRD defines the phased build plan for a custom integration middleware ("Integration Hub") that connects Mindbody, Trainerize, and Oncehub to GoHighLevel (GHL). Research confirms **no open source project exists that does this**. Two commercial products do (Autogration at $79/mo, AppConnect at $29+/mo), validating market demand but also confirming the competitive opportunity in owning this stack.

The plan starts with a lean, high-value Phase 1 that gets real data flowing in days — not weeks — then adds complexity in controlled layers.

---

## 2. Research Findings — What Already Exists

### Usable Libraries & Tools (incorporated into build plan)

| Tool | Type | Use Case | License | Quality |
|---|---|---|---|---|
| `SplitPass/mindbody-api` | TypeScript library | Mindbody v6 API + webhook types | MIT | Good — maintained Jul 2024 |
| `mastanley13/GoHighLevel-MCP` | MCP server | 269 GHL tools for AI-agent layer | ISC | Excellent — 162 stars, active |
| `M2KDevelopments/gohighlevel` | Node.js library | GHL v2 API client reference | MIT | Good — 79 commits |
| `GoHighLevel/ghl-marketplace-app-template` | TS/Vue template | OAuth + webhook scaffold for GHL Marketplace | MIT | Official |
| `vespo92/MindbodyMCP` | MCP server | 50+ Mindbody tools for AI agents | MIT | Active — v2.0.2, Sep 2025 |
| n8n HighLevel node | No-code node | GHL contacts, opportunities, tasks, calendar | Apache-2.0 | Built-in to n8n |

### Key Platform Findings

- **Mindbody → Zapier**: NOT native. Requires AppConnect by APIANT ($29+/mo) as middleware.
- **Oncehub → Zapier**: Native. All 5 booking lifecycle events supported.
- **Trainerize → Zapier**: Native. New client, subscription, tag, and goal events.
- **GHL → Zapier**: Native (as "LeadConnector"). Full contact/opportunity/workflow actions.
- **Trainerize ↔ Mindbody**: A **native platform-level sync already exists** — when a Mindbody contract is purchased, Trainerize auto-imports the client and fires automations. No code needed for this direction.
- **GHL Inbound Webhook**: GHL has a built-in "Inbound Webhook" workflow trigger — any platform can POST JSON to a GHL workflow URL to create contacts, add tags, change pipeline stages, or fire automations without touching the GHL API directly.
- **MCP opportunity**: GHL has the richest MCP ecosystem of any CRM. Mindbody has one active MCP server. Oncehub and Trainerize have none.

### Competitive Landscape

| Product | Price | Coverage | Open Source? |
|---|---|---|---|
| **Autogration** | $79/mo per location | MB ↔ GHL only. 45 data points, 2-way calendar sync | No |
| **AppConnect (APIANT)** | $29+/mo | MB webhooks → Zapier/Make/any URL (middleware layer) | No |
| **This Hub** | Self-hosted / SaaS | MB + TZ + Oncehub ↔ GHL, all flows | Yes (our build) |

---

## 3. Problem Statement

Fitness businesses running Mindbody, Trainerize, and Oncehub alongside GoHighLevel have no automated way to keep these systems in sync. Client data lives in silos, memberships don't trigger marketing automations, consultation bookings don't update CRM pipelines, and purchases in one platform are invisible to others. The manual overhead is significant, and commercial solutions either cover only one platform pair or cost $79+/month per location.

---

## 4. Goals

- Build a self-hosted, configurable webhook middleware that reliably moves data between all 4 platforms
- Start with the highest-impact, lowest-complexity flows (Phase 1) and earn trust before adding complexity
- Use existing open source libraries where they exist to avoid reinventing stable components
- Produce something deployable in days, not months

## 5. Non-Goals (All Phases)

- Replacing GHL as the CRM — GHL is always the destination for contacts/pipeline
- Building a no-code UI for mapping configuration (at least not until Phase 3)
- Supporting platforms beyond the four listed
- Real-time two-way calendar sync at the sub-minute level (polling is fine for Phase 1/2)

---

## 6. Phased Roadmap

---

### Phase 1 — "Quick Win" Foundation
**Goal:** Get real data flowing. Prove the system works end-to-end with zero downtime risk.
**Scope:** 3 flows, read-only from source platforms, write-only into GHL.
**Estimated Build Time:** 3–5 days (most infrastructure already built)

#### What Gets Built

**Flow 1: Oncehub → GHL Pipeline**
- Receive Oncehub booking webhooks (booked, rescheduled, cancelled, completed, no-show)
- Upsert contact in GHL by email
- Create or move opportunity to the correct pipeline stage
- Apply event tags (e.g. `consultation-booked`, `consultation-completed`)
- **Why first:** Cleanest webhook API of the four platforms, immediate business value, zero auth complexity, already coded — needs config and testing only.

**Flow 2: Mindbody → GHL Contact Sync**
- Receive `client.created` and `client.updated` webhooks from Mindbody
- Upsert contact in GHL (create if new, update if exists — matched by email)
- Apply `mindbody-client` source tag
- **Why second:** Highest event volume, most critical for keeping GHL as source of truth.

**Flow 3: Mindbody Purchase → GHL Tags + Workflow**
- Receive `sale.completed` webhook from Mindbody
- Parse purchased item names, apply configured tags (e.g. `purchased-intro`, `mb-member`)
- Trigger configured GHL workflow for the purchase type
- **Why third:** Directly enables marketing automation — this is where the ROI is visible immediately.

#### What Does NOT Ship in Phase 1
- HL → Mindbody (bidirectional)
- Trainerize integration
- Client index scoring
- Admin dashboard / event logs
- Error retry UI

#### Technical Approach
- **Stack:** Next.js API routes on Vercel (already scaffolded)
- **Mindbody library:** Use `SplitPass/mindbody-api` for type-safe webhook payload parsing
- **GHL writes:** Use GHL Inbound Webhook Workflow Trigger as the primary delivery mechanism — this avoids API key complexity for the GHL side and lets non-technical users configure the automations inside GHL itself
- **Fallback:** Direct GHL API (already built in `lib/clients/highlevel.ts`) for flows that need more control (e.g. specific pipeline stage targeting)
- **Webhook security:** HMAC signature verification on all inbound endpoints (already wired)

#### Phase 1 Configuration Requirements (env vars to fill in)
```
# Mindbody
MINDBODY_API_KEY
MINDBODY_SITE_ID
MINDBODY_STAFF_USERNAME / PASSWORD
MINDBODY_WEBHOOK_SECRET

# HighLevel
HIGHLEVEL_API_KEY
HIGHLEVEL_LOCATION_ID
HIGHLEVEL_PIPELINE_ID
HL_STAGE_CONSULTATION_BOOKED
HL_STAGE_CONSULTATION_RESCHEDULED
HL_STAGE_CONSULTATION_CANCELLED
HL_STAGE_CONSULTATION_COMPLETED
HL_STAGE_NO_SHOW

# Oncehub
ONCEHUB_WEBHOOK_SECRET
```

#### Phase 1 Success Criteria
- [ ] An Oncehub booking creates or updates a GHL opportunity stage within 10 seconds
- [ ] A new Mindbody client appears as a GHL contact within 30 seconds
- [ ] A Mindbody purchase fires the correct GHL tag and (if configured) triggers a workflow
- [ ] All webhook endpoints return 200 and log events cleanly
- [ ] Zero data loss on any of the three flows over a 7-day test period

---

### Phase 2 — Bidirectional + Trainerize
**Goal:** Close the loop — actions in GHL create records in Mindbody, and Trainerize purchases sync to GHL.
**Estimated Build Time:** 1–2 weeks after Phase 1 is stable

#### What Gets Built

**Flow 4: GHL Appointment → Mindbody Appointment**
- When a consultation is booked inside GHL (via calendar or Oncehub-triggered workflow), create a prospect and appointment in Mindbody
- Match existing MB client by email; create if not found
- Map GHL appointment time/staff to MB appointment

**Flow 5: GHL Purchase → Mindbody Service**
- When a GHL order or invoice is marked paid, create or merge the contact in Mindbody and add the appropriate service/package to their account
- Mapping table: GHL product ID → Mindbody service ID (configured in `lib/config/mappings.ts`)

**Flow 6: Trainerize → GHL Contact + Tags**
- Receive Trainerize subscription/purchase webhooks
- Upsert GHL contact
- Apply plan-specific tags and trigger configured workflows
- Handle subscription cancellation/expiration with appropriate tags

**Flow 7: Mindbody Client Index → GHL Tags**
- When a client's index score changes in Mindbody, update corresponding GHL risk/value tags
- e.g. index 0–1 → `at-risk-client`, index 4–5 → `high-value-client`

#### New Infrastructure in Phase 2
- **Event log:** Simple database (SQLite via Prisma or Vercel KV) storing every webhook event with status (received, processed, failed)
- **Retry queue:** Failed handler calls retry up to 3 times with exponential backoff
- **Deduplication:** Store processed event IDs (messageId from MB, booking ID from Oncehub) to prevent double-processing on webhook retries

#### Phase 2 Configuration Additions
```
# HL → Mindbody product mappings
HL_PRODUCT_MONTHLY_ID → MB_SERVICE_MONTHLY_ID
HL_PRODUCT_ANNUAL_ID  → MB_SERVICE_ANNUAL_ID
MB_CONSULTATION_SERVICE_ID
MB_DEFAULT_LOCATION_ID
MB_DEFAULT_STAFF_ID

# Trainerize
TRAINERIZE_API_KEY
TRAINERIZE_WEBHOOK_SECRET
HL_WORKFLOW_TZ_COACHING
HL_WORKFLOW_TZ_VIP
```

---

### Phase 3 — Observability & Intelligence
**Goal:** Make the hub visible, manageable, and smarter. Add AI-agent capabilities.
**Estimated Build Time:** 2–3 weeks after Phase 2 is stable

#### What Gets Built

**Admin Dashboard**
- Event log UI: view all webhook events, payload previews, success/fail status, retry history
- Integration health indicators per platform
- Simple on/off toggle per flow

**MCP Server Layer**
- Expose the hub's capabilities as MCP tools for AI agents
- Leverage `mastanley13/GoHighLevel-MCP` (162 stars) for GHL operations
- Leverage `vespo92/MindbodyMCP` (MIT, Sep 2025) for Mindbody read/write
- Build custom MCP tools for Oncehub and Trainerize (none exist)
- Result: an AI agent can ask "show me all clients who purchased a membership in Mindbody but have no active GHL workflow" and act on it

**n8n Integration**
- Ship a pre-built n8n workflow template for each integration flow
- Uses n8n's built-in HighLevel node on the GHL side
- Uses HTTP Request nodes + this hub's webhook endpoints on the source side
- Gives non-technical users a drag-and-drop interface over the hub's logic

**Smart Tagging**
- Client value scoring algorithm: combine MB visit frequency, purchase history, and membership tier into a composite score
- Score → GHL tag and custom field update on a nightly sync

---

### Phase 4 — Product & Scale
**Goal:** Turn the hub into a multi-tenant SaaS or GHL Marketplace app.
**Estimated Build Time:** 4–8 weeks after Phase 3

#### What Gets Built

**Multi-Tenant Support**
- Each "tenant" = one Mindbody site + one GHL location
- Tenant management UI (add/remove locations, configure mappings per tenant)
- Separate API key storage per tenant (encrypted at rest)

**GHL Marketplace App**
- Register as an official GHL Marketplace app (OAuth2 flow instead of private API keys)
- GHL users install the app from the marketplace — no manual webhook configuration
- Follow `GoHighLevel/ghl-marketplace-app-template` for structure

**White-Label Ready**
- Configurable branding per agency
- Agency can install hub for all their client locations from one dashboard

**Billing Integration**
- Usage-based billing if offered as SaaS (per-location per-month)
- Stripe integration for agency subscription management

---

## 7. Open Questions (Need Answers Before Phase 1 Ship)

| # | Question | Why It Matters |
|---|---|---|
| 1 | Do you have a Mindbody developer API key? | Required to activate webhooks on MB side |
| 2 | Which GHL pipeline and stage IDs map to which Oncehub events? | Must be configured before Oncehub → GHL goes live |
| 3 | Do you want to use GHL's Inbound Webhook trigger (simpler, less control) or direct GHL API calls (more control, harder)? | Affects how we wire the GHL-side of Phase 1 |
| 4 | Is AppConnect ($29/mo) acceptable as a bridge for Mindbody webhooks, or do we build the native receiver? | Native is built; AppConnect is simpler to activate but adds cost and dependency |
| 5 | What Trainerize plan are you on? (API webhook access requires Studio/Enterprise) | Determines if Phase 2 Trainerize flow is possible |
| 6 | Is this intended to be a single-location tool or multi-tenant from the start? | Affects how we store config and credentials |
| 7 | Are there specific GHL workflow IDs you want triggered for each event type? | Required for purchase → workflow trigger in Phase 1 |

---

## 8. Technical Architecture Summary

```
                        ┌──────────────────────────────┐
                        │       Integration Hub        │
                        │      (Next.js / Vercel)      │
                        │                              │
Mindbody ──────────────►│ POST /api/webhooks/mindbody  │
                        │   → mindbody-to-highlevel.ts │
                        │                              │──────────► GoHighLevel API v2
Oncehub ───────────────►│ POST /api/webhooks/oncehub   │            (contacts, tags,
                        │   → oncehub-to-highlevel.ts  │             pipeline stages,
                        │                              │             workflows)
Trainerize ────────────►│ POST /api/webhooks/trainerize│
                        │   → trainerize-to-highlevel  │
                        │                              │
GoHighLevel ───────────►│ POST /api/webhooks/highlevel │──────────► Mindbody API v6
                        │   → highlevel-to-mindbody.ts │            (contacts, appts,
                        │                              │             services)
                        │   lib/config/mappings.ts     │
                        │   (all business logic lives  │
                        │    in one editable file)     │
                        └──────────────────────────────┘
```

**Guiding principles:**
- All business logic lives in `lib/config/mappings.ts` — change tags, workflows, stages without touching handler code
- Handlers are thin: receive event → lookup/upsert contact → apply tags → trigger workflow → done
- Webhook signature verification on all inbound endpoints
- All credentials in env vars — never hardcoded
- Deploy to Vercel; each webhook URL is a stable HTTPS endpoint

---

## 9. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Mindbody API access takes weeks to approve | Medium | Start with AppConnect as bridge; migrate to native webhooks once approved |
| Trainerize webhook access requires Enterprise plan | Medium | Confirm plan tier before building Phase 2 Trainerize flow; use Zapier as fallback |
| GHL API rate limits cause tag/workflow failures | Low | Add exponential backoff + retry queue in Phase 2 |
| Duplicate contacts created if email doesn't match exactly | Medium | Phase 1: match on email only. Phase 2: add phone fallback + fuzzy match option |
| Oncehub webhook payload format changes | Low | Pin webhook version; add payload validation layer |

---

*End of PRD v0.1 — Pending Review*
