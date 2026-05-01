import type {
  HLContact,
  HLContactInput,
  HLOpportunity,
  HLOpportunityInput,
  HLSearchContactsResponse,
  HLCreateContactResponse,
  HLOpportunityResponse,
} from "@/lib/types/highlevel";

const HL_BASE = "https://services.leadconnectorhq.com";
const HL_VERSION = "2021-07-28";

async function hlFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${HL_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HIGHLEVEL_API_KEY}`,
      Version: HL_VERSION,
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HighLevel ${options.method ?? "GET"} ${path} failed: ${res.status} ${body}`);
  }

  return res.json();
}

// ── Contacts ─────────────────────────────────────────────────────────────────

export async function searchContactByEmail(
  email: string
): Promise<HLContact | null> {
  const locationId = process.env.HIGHLEVEL_LOCATION_ID!;
  const data = await hlFetch<HLSearchContactsResponse>(
    `/contacts/?locationId=${locationId}&email=${encodeURIComponent(email)}`
  );
  return data.contacts?.[0] ?? null;
}

export async function searchContactByPhone(
  phone: string
): Promise<HLContact | null> {
  const locationId = process.env.HIGHLEVEL_LOCATION_ID!;
  const data = await hlFetch<HLSearchContactsResponse>(
    `/contacts/?locationId=${locationId}&phone=${encodeURIComponent(phone)}`
  );
  return data.contacts?.[0] ?? null;
}

export async function createContact(input: HLContactInput): Promise<HLContact> {
  const data = await hlFetch<HLCreateContactResponse>("/contacts/", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      locationId: process.env.HIGHLEVEL_LOCATION_ID,
    }),
  });
  return data.contact;
}

export async function updateContact(
  contactId: string,
  updates: Partial<HLContactInput>
): Promise<HLContact> {
  const data = await hlFetch<HLCreateContactResponse>(`/contacts/${contactId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  return data.contact;
}

export async function addTags(
  contactId: string,
  tags: string[]
): Promise<void> {
  await hlFetch(`/contacts/${contactId}/tags`, {
    method: "POST",
    body: JSON.stringify({ tags }),
  });
}

export async function removeTags(
  contactId: string,
  tags: string[]
): Promise<void> {
  await hlFetch(`/contacts/${contactId}/tags`, {
    method: "DELETE",
    body: JSON.stringify({ tags }),
  });
}

// Upsert: find by email, create if not found. Returns contact + whether it was created.
export async function upsertContact(
  input: HLContactInput
): Promise<{ contact: HLContact; created: boolean }> {
  if (input.email) {
    const existing = await searchContactByEmail(input.email);
    if (existing) {
      const updated = await updateContact(existing.id, input);
      return { contact: updated, created: false };
    }
  }
  const contact = await createContact(input);
  return { contact, created: true };
}

// ── Workflows ─────────────────────────────────────────────────────────────────

export async function triggerWorkflow(
  contactId: string,
  workflowId: string
): Promise<void> {
  await hlFetch(`/contacts/${contactId}/workflow/${workflowId}/subscribe`, {
    method: "POST",
  });
}

// ── Opportunities / Pipeline ──────────────────────────────────────────────────

export async function createOpportunity(
  input: HLOpportunityInput
): Promise<HLOpportunity> {
  const data = await hlFetch<HLOpportunityResponse>("/opportunities/", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.opportunity;
}

export async function updateOpportunityStage(
  opportunityId: string,
  pipelineStageId: string,
  status?: HLOpportunity["status"]
): Promise<HLOpportunity> {
  const body: Record<string, unknown> = { pipelineStageId };
  if (status) body.status = status;

  const data = await hlFetch<HLOpportunityResponse>(
    `/opportunities/${opportunityId}`,
    { method: "PUT", body: JSON.stringify(body) }
  );
  return data.opportunity;
}

export async function getOpportunitiesForContact(
  contactId: string
): Promise<HLOpportunity[]> {
  const locationId = process.env.HIGHLEVEL_LOCATION_ID!;
  const data = await hlFetch<{ opportunities: HLOpportunity[] }>(
    `/opportunities/search?location_id=${locationId}&contact_id=${contactId}`
  );
  return data.opportunities ?? [];
}
