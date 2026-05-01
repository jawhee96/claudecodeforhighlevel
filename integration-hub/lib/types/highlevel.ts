// HighLevel (GoHighLevel) API v2 types

export interface HLContact {
  id: string;
  locationId: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  tags?: string[];
  source?: string;
  dateAdded?: string;
  dateUpdated?: string;
  customFields?: HLCustomField[];
  dnd?: boolean;
  type?: string;
}

export interface HLContactInput {
  locationId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  tags?: string[];
  source?: string;
  customFields?: HLCustomField[];
}

export interface HLCustomField {
  id: string;
  value: string | string[] | number;
}

export interface HLTagsInput {
  tags: string[];
}

export interface HLOpportunity {
  id: string;
  name: string;
  pipelineId: string;
  pipelineStageId: string;
  status: "open" | "won" | "lost" | "abandoned";
  contactId: string;
  monetaryValue?: number;
  assignedTo?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HLOpportunityInput {
  pipelineId: string;
  pipelineStageId: string;
  name: string;
  contactId: string;
  status?: "open" | "won" | "lost" | "abandoned";
  monetaryValue?: number;
  assignedTo?: string;
  notes?: string;
}

export interface HLCalendarEvent {
  id: string;
  calendarId: string;
  locationId: string;
  contactId?: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  address?: string;
}

export interface HLWorkflowSubscribeInput {
  contactId: string;
  workflowId: string;
}

// ── Webhook event shapes ──────────────────────────────────────────────────────

export type HLWebhookEventType =
  | "ContactCreate"
  | "ContactUpdate"
  | "ContactDelete"
  | "OpportunityCreate"
  | "OpportunityUpdate"
  | "AppointmentCreate"
  | "AppointmentUpdate"
  | "OrderCreate"
  | "OrderUpdate"
  | "InvoicePaid"
  | "FormSubmission"
  | "SurveySubmission";

export interface HLWebhookPayload {
  type: HLWebhookEventType;
  locationId: string;
  id: string;
  // Contact fields (flattened on contact events)
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  // Opportunity fields
  opportunityId?: string;
  pipelineId?: string;
  pipelineStageId?: string;
  status?: string;
  monetaryValue?: number;
  // Appointment fields
  appointmentId?: string;
  calendarId?: string;
  startTime?: string;
  endTime?: string;
  title?: string;
  // Order/Invoice fields
  orderId?: string;
  amount?: number;
  products?: HLOrderProduct[];
  // Raw contact object when present
  contact?: HLContact;
  // Metadata
  timestamp?: string;
}

export interface HLOrderProduct {
  productId: string;
  name: string;
  qty: number;
  price: number;
}

export interface HLSearchContactsResponse {
  contacts: HLContact[];
  count: number;
  total: number;
}

export interface HLCreateContactResponse {
  contact: HLContact;
}

export interface HLOpportunityResponse {
  opportunity: HLOpportunity;
}
