import type { TrainerizeWebhookPayload } from "@/lib/types/trainerize";
import {
  upsertContact,
  addTags,
  triggerWorkflow,
} from "@/lib/clients/highlevel";
import {
  tagsForTrainerizePlan,
  workflowForTrainerizePlan,
} from "@/lib/config/mappings";

export async function routeTrainerizeEvent(payload: TrainerizeWebhookPayload) {
  const { event_type, data } = payload;

  switch (event_type) {
    case "subscription.created":
    case "subscription.renewed":
    case "purchase.completed":
      return handleTrainerizePurchase(payload);
    case "client.created":
    case "client.updated":
      return handleTrainerizeClient(payload);
    case "subscription.cancelled":
    case "subscription.expired":
      return handleTrainerizeSubscriptionEnd(payload);
    default:
      console.log(`[TZ→HL] unhandled event type: ${event_type}`);
  }
}

async function handleTrainerizePurchase(payload: TrainerizeWebhookPayload) {
  const { event_type, data } = payload;

  // Resolve client info — may come from subscription or purchase data
  const clientData = data.client;
  const subscriptionData = data.subscription;
  const purchaseData = data.purchase;

  const email = clientData?.email;
  if (!email) {
    console.warn(`[TZ→HL] ${event_type}: no client email available, skipping`);
    return;
  }

  const planName =
    subscriptionData?.plan_name ??
    purchaseData?.item_name ??
    "";

  const { contact, created } = await upsertContact({
    locationId: process.env.HIGHLEVEL_LOCATION_ID!,
    firstName: clientData.first_name,
    lastName: clientData.last_name,
    email: clientData.email,
    phone: clientData.phone,
    source: "trainerize",
  });

  if (created) {
    console.log(`[TZ→HL] created new HL contact for ${email}: ${contact.id}`);
  }

  // Apply tags based on plan
  const tags = [
    "trainerize-client",
    ...tagsForTrainerizePlan(planName),
  ];

  if (event_type === "subscription.renewed") {
    tags.push("tz-renewed");
  }

  await addTags(contact.id, [...new Set(tags)]);

  // Trigger workflow if configured
  const workflowId = workflowForTrainerizePlan(planName);
  if (workflowId) {
    await triggerWorkflow(contact.id, workflowId).catch((e) =>
      console.error(`[TZ→HL] workflow trigger failed for plan "${planName}":`, e)
    );
  }

  const amount =
    subscriptionData?.amount_paid ?? purchaseData?.amount ?? 0;
  const currency =
    subscriptionData?.currency ?? purchaseData?.currency ?? "USD";

  console.log(
    `[TZ→HL] ${event_type}: synced ${email} → HL contact ${contact.id}, plan "${planName}", ` +
      `amount ${currency} ${amount}, tags: [${tags.join(", ")}]`
  );
}

async function handleTrainerizeClient(payload: TrainerizeWebhookPayload) {
  const clientData = payload.data.client;
  if (!clientData?.email) return;

  const { contact } = await upsertContact({
    locationId: process.env.HIGHLEVEL_LOCATION_ID!,
    firstName: clientData.first_name,
    lastName: clientData.last_name,
    email: clientData.email,
    phone: clientData.phone,
    source: "trainerize",
    tags: ["trainerize-client"],
  });

  console.log(
    `[TZ→HL] ${payload.event_type}: synced ${clientData.email} → HL contact ${contact.id}`
  );
}

async function handleTrainerizeSubscriptionEnd(payload: TrainerizeWebhookPayload) {
  const clientData = payload.data.client;
  if (!clientData?.email) return;

  const { contact } = await upsertContact({
    locationId: process.env.HIGHLEVEL_LOCATION_ID!,
    firstName: clientData.first_name,
    lastName: clientData.last_name,
    email: clientData.email,
    source: "trainerize",
  });

  const tags =
    payload.event_type === "subscription.cancelled"
      ? ["tz-cancelled"]
      : ["tz-expired"];

  await addTags(contact.id, tags);

  console.log(
    `[TZ→HL] ${payload.event_type}: tagged ${clientData.email} as ${tags.join(", ")}`
  );
}
