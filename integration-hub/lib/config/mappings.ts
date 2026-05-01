// ─────────────────────────────────────────────────────────────────────────────
// Integration Hub — Business Logic Mappings
//
// Edit this file to customize how events from each platform translate into
// HighLevel tags, workflow triggers, and pipeline stage changes.
// ─────────────────────────────────────────────────────────────────────────────

// ── Mindbody membership name → HighLevel tags ─────────────────────────────────
// Keys are Mindbody membership names (case-insensitive match).
// Values are arrays of HL tags to apply.
export const MEMBERSHIP_TAG_MAP: Record<string, string[]> = {
  "Monthly Unlimited": ["mb-member", "mb-membership-monthly", "active-member"],
  "Annual Membership": ["mb-member", "mb-membership-annual", "active-member", "vip"],
  "10-Class Pack": ["mb-class-pack", "mb-10pack"],
  "20-Class Pack": ["mb-class-pack", "mb-20pack"],
  "Drop-In": ["mb-drop-in"],
  "Intro Special": ["mb-intro", "new-client"],
  "Personal Training Monthly": ["mb-pt-monthly", "active-member", "pt-client"],
  "Personal Training Pack": ["mb-pt-pack", "pt-client"],
};

// Tags to remove when a membership expires/is cancelled
export const MEMBERSHIP_REMOVED_TAGS: Record<string, string[]> = {
  "Monthly Unlimited": ["mb-membership-monthly", "active-member"],
  "Annual Membership": ["mb-membership-annual", "active-member", "vip"],
  "Personal Training Monthly": ["mb-pt-monthly", "active-member"],
};

// ── Mindbody membership name → HighLevel workflow ID ─────────────────────────
// Set the workflow IDs from your HL account. Leave value blank to skip.
export const MEMBERSHIP_WORKFLOW_MAP: Record<string, string> = {
  "Monthly Unlimited": process.env.HL_WORKFLOW_MONTHLY_MEMBER ?? "",
  "Annual Membership": process.env.HL_WORKFLOW_ANNUAL_MEMBER ?? "",
  "Intro Special": process.env.HL_WORKFLOW_NEW_CLIENT ?? "",
  "Personal Training Monthly": process.env.HL_WORKFLOW_PT_CLIENT ?? "",
};

// ── Mindbody client index → HighLevel tags ────────────────────────────────────
// Mindbody client indexes track visit frequency/value.
// Values are the "Name" from MBClientIndexValue.
export const CLIENT_INDEX_TAG_MAP: Record<string, string[]> = {
  high: ["mb-index-high", "high-value-client"],
  medium: ["mb-index-medium"],
  low: ["mb-index-low", "at-risk-client"],
  "5": ["mb-index-5", "vip-client"],
  "4": ["mb-index-4", "high-value-client"],
  "3": ["mb-index-3"],
  "2": ["mb-index-2", "at-risk-client"],
  "1": ["mb-index-1", "at-risk-client"],
  "0": ["mb-index-0", "lapsed-client"],
};

// ── Mindbody purchase item name → HighLevel tags ──────────────────────────────
// Matches against the item name in a sale. Supports partial matching.
export const PURCHASE_TAG_MAP: Record<string, string[]> = {
  "Intro Special": ["purchased-intro", "new-client"],
  "10-Class Pack": ["purchased-class-pack"],
  "20-Class Pack": ["purchased-class-pack"],
  "Monthly Unlimited": ["purchased-membership"],
  "Annual Membership": ["purchased-membership"],
  "Personal Training": ["purchased-pt"],
  "Nutrition": ["purchased-nutrition"],
  "Workshop": ["purchased-workshop"],
  "Retail": ["purchased-retail"],
};

// ── Mindbody purchase item name → HighLevel workflow ID ──────────────────────
export const PURCHASE_WORKFLOW_MAP: Record<string, string> = {
  "Intro Special": process.env.HL_WORKFLOW_INTRO_PURCHASE ?? "",
  "Monthly Unlimited": process.env.HL_WORKFLOW_MEMBERSHIP_PURCHASE ?? "",
  "Annual Membership": process.env.HL_WORKFLOW_MEMBERSHIP_PURCHASE ?? "",
  "Personal Training": process.env.HL_WORKFLOW_PT_PURCHASE ?? "",
};

// ── Oncehub booking page name → HighLevel pipeline stage ID ──────────────────
// Keys are Oncehub booking page names (or event type names).
// Values are HL pipeline stage IDs for each booking lifecycle event.
export const ONCEHUB_STAGE_MAP: Record<
  string,
  { pipelineId: string; stageId: string }
> = {
  "booking.created": {
    pipelineId: process.env.HL_PIPELINE_ID ?? "",
    stageId: process.env.HL_STAGE_CONSULTATION_BOOKED ?? "",
  },
  "booking.rescheduled": {
    pipelineId: process.env.HL_PIPELINE_ID ?? "",
    stageId: process.env.HL_STAGE_CONSULTATION_RESCHEDULED ?? "",
  },
  "booking.canceled": {
    pipelineId: process.env.HL_PIPELINE_ID ?? "",
    stageId: process.env.HL_STAGE_CONSULTATION_CANCELLED ?? "",
  },
  "booking.completed": {
    pipelineId: process.env.HL_PIPELINE_ID ?? "",
    stageId: process.env.HL_STAGE_CONSULTATION_COMPLETED ?? "",
  },
  "booking.no_show": {
    pipelineId: process.env.HL_PIPELINE_ID ?? "",
    stageId: process.env.HL_STAGE_NO_SHOW ?? "",
  },
};

// Tags to apply for each Oncehub event
export const ONCEHUB_TAG_MAP: Record<string, string[]> = {
  "booking.created": ["consultation-booked"],
  "booking.rescheduled": ["consultation-rescheduled"],
  "booking.canceled": ["consultation-cancelled"],
  "booking.completed": ["consultation-completed"],
  "booking.no_show": ["consultation-no-show"],
};

// ── Trainerize plan name → HighLevel tags ─────────────────────────────────────
export const TRAINERIZE_PLAN_TAG_MAP: Record<string, string[]> = {
  "Online Coaching": ["tz-client", "tz-online-coaching"],
  "App Only": ["tz-client", "tz-app-only"],
  "Custom Plan": ["tz-client", "tz-custom-plan"],
  "Nutrition Coaching": ["tz-client", "tz-nutrition"],
  "VIP Coaching": ["tz-client", "tz-vip", "vip"],
};

// ── Trainerize plan name → HighLevel workflow ID ──────────────────────────────
export const TRAINERIZE_PLAN_WORKFLOW_MAP: Record<string, string> = {
  "Online Coaching": process.env.HL_WORKFLOW_TZ_COACHING ?? "",
  "VIP Coaching": process.env.HL_WORKFLOW_TZ_VIP ?? "",
  "Nutrition Coaching": process.env.HL_WORKFLOW_TZ_NUTRITION ?? "",
};

// ── HighLevel → Mindbody: consultation appointment config ────────────────────
// Mindbody service ID used when booking a consultation from HL
export const MB_CONSULTATION_SERVICE_ID = parseInt(
  process.env.MB_CONSULTATION_SERVICE_ID ?? "0"
);
// Default Mindbody location for new bookings from HL
export const MB_DEFAULT_LOCATION_ID = parseInt(
  process.env.MB_DEFAULT_LOCATION_ID ?? "1"
);
// Default staff ID to assign new consultation appointments
export const MB_DEFAULT_STAFF_ID = parseInt(
  process.env.MB_DEFAULT_STAFF_ID ?? "1"
);

// Helpers ─────────────────────────────────────────────────────────────────────

export function tagsForMembership(membershipName: string): string[] {
  const key = Object.keys(MEMBERSHIP_TAG_MAP).find(
    (k) => k.toLowerCase() === membershipName.toLowerCase()
  );
  return key ? MEMBERSHIP_TAG_MAP[key] : [];
}

export function workflowForMembership(membershipName: string): string {
  const key = Object.keys(MEMBERSHIP_WORKFLOW_MAP).find(
    (k) => k.toLowerCase() === membershipName.toLowerCase()
  );
  return key ? MEMBERSHIP_WORKFLOW_MAP[key] : "";
}

export function tagsForPurchase(itemName: string): string[] {
  const key = Object.keys(PURCHASE_TAG_MAP).find((k) =>
    itemName.toLowerCase().includes(k.toLowerCase())
  );
  return key ? PURCHASE_TAG_MAP[key] : [];
}

export function workflowForPurchase(itemName: string): string {
  const key = Object.keys(PURCHASE_WORKFLOW_MAP).find((k) =>
    itemName.toLowerCase().includes(k.toLowerCase())
  );
  return key ? PURCHASE_WORKFLOW_MAP[key] : "";
}

export function tagsForClientIndex(indexName: string): string[] {
  const key = Object.keys(CLIENT_INDEX_TAG_MAP).find(
    (k) => k.toLowerCase() === indexName.toLowerCase()
  );
  return key ? CLIENT_INDEX_TAG_MAP[key] : [];
}

export function tagsForTrainerizePlan(planName: string): string[] {
  const key = Object.keys(TRAINERIZE_PLAN_TAG_MAP).find(
    (k) => k.toLowerCase() === planName.toLowerCase()
  );
  return key ? TRAINERIZE_PLAN_TAG_MAP[key] : ["tz-client"];
}

export function workflowForTrainerizePlan(planName: string): string {
  const key = Object.keys(TRAINERIZE_PLAN_WORKFLOW_MAP).find(
    (k) => k.toLowerCase() === planName.toLowerCase()
  );
  return key ? TRAINERIZE_PLAN_WORKFLOW_MAP[key] : "";
}
