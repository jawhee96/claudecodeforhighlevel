import type { OncehubWebhookPayload } from "@/lib/types/oncehub";
import {
  upsertContact,
  addTags,
  createOpportunity,
  updateOpportunityStage,
  getOpportunitiesForContact,
} from "@/lib/clients/highlevel";
import {
  ONCEHUB_STAGE_MAP,
  ONCEHUB_TAG_MAP,
} from "@/lib/config/mappings";

export async function routeOncehubEvent(payload: OncehubWebhookPayload) {
  const { event_type, data } = payload;
  const booking = data.booking;
  const customer = booking.customer;

  // Upsert the contact in HighLevel
  const { contact, created } = await upsertContact({
    locationId: process.env.HIGHLEVEL_LOCATION_ID!,
    firstName: customer.first_name ?? customer.name.split(" ")[0],
    lastName: customer.last_name ?? customer.name.split(" ").slice(1).join(" "),
    email: customer.email,
    phone: customer.phone,
    source: "oncehub",
  });

  if (created) {
    console.log(`[OH→HL] created new HL contact for ${customer.email}: ${contact.id}`);
  }

  // Apply event tags
  const tags = ONCEHUB_TAG_MAP[event_type] ?? [];
  if (tags.length > 0) {
    await addTags(contact.id, tags);
  }

  // Resolve pipeline stage config
  const stageConfig = ONCEHUB_STAGE_MAP[event_type];

  if (!stageConfig?.pipelineId || !stageConfig?.stageId) {
    console.warn(
      `[OH→HL] ${event_type}: no pipeline stage configured in ONCEHUB_STAGE_MAP — skipping opportunity update`
    );
    return;
  }

  if (event_type === "booking.created") {
    // New booking: create a fresh opportunity (or reopen if lapsed)
    const existing = await getOpportunitiesForContact(contact.id);
    const openOpp = existing.find((o) => o.status === "open");

    if (openOpp) {
      // Move existing open opportunity to the booked stage
      await updateOpportunityStage(openOpp.id, stageConfig.stageId);
      console.log(
        `[OH→HL] booking.created: moved opportunity ${openOpp.id} to stage ${stageConfig.stageId}`
      );
    } else {
      const opp = await createOpportunity({
        pipelineId: stageConfig.pipelineId,
        pipelineStageId: stageConfig.stageId,
        name: `Consultation — ${customer.name}`,
        contactId: contact.id,
        status: "open",
        notes: buildBookingNotes(booking),
      });
      console.log(
        `[OH→HL] booking.created: created opportunity ${opp.id} for ${customer.email}`
      );
    }
    return;
  }

  // For rescheduled / cancelled / completed / no_show: update the latest opportunity
  const opportunities = await getOpportunitiesForContact(contact.id);
  const latestOpp =
    opportunities.find((o) => o.status === "open") ?? opportunities[0];

  if (!latestOpp) {
    console.warn(
      `[OH→HL] ${event_type}: no opportunity found for contact ${contact.id} — creating one`
    );
    await createOpportunity({
      pipelineId: stageConfig.pipelineId,
      pipelineStageId: stageConfig.stageId,
      name: `Consultation — ${customer.name}`,
      contactId: contact.id,
      status: event_type === "booking.completed" ? "won" : "open",
      notes: buildBookingNotes(booking),
    });
    return;
  }

  const opportunityStatus: "open" | "won" | "lost" | "abandoned" =
    event_type === "booking.completed"
      ? "won"
      : event_type === "booking.canceled"
      ? "lost"
      : "open";

  await updateOpportunityStage(latestOpp.id, stageConfig.stageId, opportunityStatus);

  console.log(
    `[OH→HL] ${event_type}: updated opportunity ${latestOpp.id} → stage ${stageConfig.stageId}, status: ${opportunityStatus}`
  );
}

function buildBookingNotes(booking: OncehubWebhookPayload["data"]["booking"]): string {
  const lines = [
    `Oncehub booking ID: ${booking.id}`,
    `Time: ${booking.start_time} – ${booking.end_time}`,
  ];

  if (booking.booking_page?.name) {
    lines.push(`Booking page: ${booking.booking_page.name}`);
  }

  if (booking.meeting_url) {
    lines.push(`Meeting URL: ${booking.meeting_url}`);
  }

  if (booking.location) {
    lines.push(`Location: ${booking.location}`);
  }

  if (booking.custom_fields?.length) {
    lines.push("Custom fields:");
    for (const field of booking.custom_fields) {
      lines.push(`  ${field.label}: ${field.value}`);
    }
  }

  return lines.join("\n");
}
