import type {
  MBWebhookPayload,
  MBClientEventContent,
  MBSaleEventContent,
} from "@/lib/types/mindbody";
import { getMBClientById, getSale } from "@/lib/clients/mindbody";
import {
  upsertContact,
  addTags,
  triggerWorkflow,
} from "@/lib/clients/highlevel";
import {
  tagsForMembership,
  tagsForClientIndex,
  tagsForPurchase,
  workflowForMembership,
  workflowForPurchase,
} from "@/lib/config/mappings";

// ── client.created / client.updated ──────────────────────────────────────────
// Syncs the MB client into HL as a contact.
// Also applies membership tags and client-index tags if present.
export async function handleClientEvent(
  payload: MBWebhookPayload<MBClientEventContent>
) {
  const { clientId } = payload.eventContent;

  const mbClient = await getMBClientById(clientId);
  if (!mbClient) {
    console.warn(`[MB→HL] client.event: could not find MB client ${clientId}`);
    return;
  }

  const { contact } = await upsertContact({
    locationId: process.env.HIGHLEVEL_LOCATION_ID!,
    firstName: mbClient.FirstName,
    lastName: mbClient.LastName,
    email: mbClient.Email,
    phone: mbClient.MobilePhone || mbClient.HomePhone,
    address1: mbClient.AddressLine1,
    city: mbClient.City,
    state: mbClient.State,
    postalCode: mbClient.PostalCode,
    country: mbClient.Country,
    source: "mindbody",
    tags: ["mindbody-client"],
  });

  const tagsToApply: string[] = [];

  // Apply membership tags
  for (const membership of mbClient.Memberships ?? []) {
    const membershipTags = tagsForMembership(membership.Name);
    tagsToApply.push(...membershipTags);

    // Trigger HL workflow for this membership (if configured)
    const workflowId = workflowForMembership(membership.Name);
    if (workflowId) {
      await triggerWorkflow(contact.id, workflowId).catch((e) =>
        console.error(`[MB→HL] workflow trigger failed for ${membership.Name}:`, e)
      );
    }
  }

  // Apply client-index tags
  for (const idx of mbClient.ClientIndexes ?? []) {
    const name = idx.Value?.Name;
    if (name) {
      tagsToApply.push(...tagsForClientIndex(name));
    }
  }

  if (tagsToApply.length > 0) {
    await addTags(contact.id, [...new Set(tagsToApply)]);
  }

  console.log(
    `[MB→HL] ${payload.eventType}: synced ${mbClient.Email} → HL contact ${contact.id}, tags: [${tagsToApply.join(", ")}]`
  );
}

// ── sale.completed ────────────────────────────────────────────────────────────
// When a purchase fires in MB, tag the HL contact and optionally trigger a workflow.
export async function handleSaleEvent(
  payload: MBWebhookPayload<MBSaleEventContent>
) {
  const { clientId, saleId, items } = payload.eventContent as MBSaleEventContent & {
    items?: Array<{ Name: string; Type: string; AMTPaid: number }>;
  };

  // Make sure we have the MB client
  const mbClient = await getMBClientById(clientId);
  if (!mbClient) {
    console.warn(`[MB→HL] sale.completed: cannot find MB client ${clientId}`);
    return;
  }

  // Fetch full sale details if items weren't included in the webhook
  let saleItems = items;
  if (!saleItems?.length) {
    const sale = await getSale(saleId);
    saleItems = sale?.PurchasedItems?.map((i) => ({
      Name: i.Name,
      Type: i.Type,
      AMTPaid: i.AMTPaid,
    }));
  }

  const { contact } = await upsertContact({
    locationId: process.env.HIGHLEVEL_LOCATION_ID!,
    firstName: mbClient.FirstName,
    lastName: mbClient.LastName,
    email: mbClient.Email,
    phone: mbClient.MobilePhone || mbClient.HomePhone,
    source: "mindbody",
  });

  const tagsToApply: string[] = ["mb-purchase"];

  for (const item of saleItems ?? []) {
    const purchaseTags = tagsForPurchase(item.Name);
    tagsToApply.push(...purchaseTags);

    const workflowId = workflowForPurchase(item.Name);
    if (workflowId) {
      await triggerWorkflow(contact.id, workflowId).catch((e) =>
        console.error(`[MB→HL] purchase workflow trigger failed for ${item.Name}:`, e)
      );
    }
  }

  if (tagsToApply.length > 0) {
    await addTags(contact.id, [...new Set(tagsToApply)]);
  }

  console.log(
    `[MB→HL] sale.completed: client ${clientId}, items [${saleItems?.map((i) => i.Name).join(", ")}], tags applied: [${tagsToApply.join(", ")}]`
  );
}

// ── client.deactivated ────────────────────────────────────────────────────────
export async function handleClientDeactivated(
  payload: MBWebhookPayload<MBClientEventContent>
) {
  const { clientId } = payload.eventContent;

  const mbClient = await getMBClientById(clientId);
  if (!mbClient?.Email) return;

  const { contact } = await upsertContact({
    locationId: process.env.HIGHLEVEL_LOCATION_ID!,
    firstName: mbClient.FirstName,
    lastName: mbClient.LastName,
    email: mbClient.Email,
    source: "mindbody",
  });

  await addTags(contact.id, ["mb-inactive"]);

  console.log(`[MB→HL] client.deactivated: ${mbClient.Email} tagged mb-inactive`);
}

// ── Router ────────────────────────────────────────────────────────────────────
export async function routeMindbodyEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: MBWebhookPayload<any>
) {
  switch (payload.eventType) {
    case "client.created":
    case "client.updated":
      return handleClientEvent(payload);
    case "client.deactivated":
      return handleClientDeactivated(payload);
    case "sale.completed":
      return handleSaleEvent(payload);
    default:
      console.log(`[MB→HL] unhandled event type: ${payload.eventType}`);
  }
}
