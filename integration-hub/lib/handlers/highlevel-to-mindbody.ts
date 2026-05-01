import type { HLWebhookPayload } from "@/lib/types/highlevel";
import {
  getMBClientByEmail,
  createMBClient,
  bookAppointment,
  addServiceToClient,
} from "@/lib/clients/mindbody";
import {
  MB_CONSULTATION_SERVICE_ID,
  MB_DEFAULT_LOCATION_ID,
  MB_DEFAULT_STAFF_ID,
} from "@/lib/config/mappings";

// ── AppointmentCreate: consultation booked in HL ──────────────────────────────
// When a calendar appointment is created in HL (e.g. via Oncehub sync or HL
// calendar), find or create the client in Mindbody and book the appointment.
export async function handleHLAppointmentCreate(payload: HLWebhookPayload) {
  const email =
    payload.contact?.email ?? payload.email;

  if (!email) {
    console.warn("[HL→MB] AppointmentCreate: no email on payload, skipping");
    return;
  }

  // Find or create the MB client
  let mbClient = await getMBClientByEmail(email);
  if (!mbClient) {
    mbClient = await createMBClient({
      FirstName: payload.contact?.firstName ?? payload.firstName ?? "",
      LastName: payload.contact?.lastName ?? payload.lastName ?? "",
      Email: email,
      MobilePhone: payload.contact?.phone ?? payload.phone ?? "",
    });
    console.log(`[HL→MB] created new MB client for ${email}: ${mbClient.Id}`);
  }

  // Book the consultation appointment in Mindbody
  if (!payload.startTime || !payload.endTime) {
    console.warn("[HL→MB] AppointmentCreate: missing startTime/endTime, skipping MB booking");
    return;
  }

  const appointment = await bookAppointment({
    ClientId: mbClient.Id,
    ServiceId: MB_CONSULTATION_SERVICE_ID,
    LocationId: MB_DEFAULT_LOCATION_ID,
    StaffId: MB_DEFAULT_STAFF_ID,
    StartDateTime: payload.startTime,
    EndDateTime: payload.endTime,
    Status: "Booked",
    Notes: `Booked via HighLevel. HL appointment ID: ${payload.appointmentId ?? payload.id}`,
  });

  console.log(
    `[HL→MB] AppointmentCreate: booked MB appointment ${appointment.Id} for ${email} at ${payload.startTime}`
  );
}

// ── OrderCreate / InvoicePaid: purchase in HL ─────────────────────────────────
// Creates or merges the MB client and adds the appropriate service to their account.
// The HL product must have a customField "mb_service_id" mapping it to a MB service.
export async function handleHLOrderCreate(payload: HLWebhookPayload) {
  const email = payload.contact?.email ?? payload.email;

  if (!email) {
    console.warn("[HL→MB] OrderCreate: no email on payload, skipping");
    return;
  }

  // Find or create the MB client
  let mbClient = await getMBClientByEmail(email);
  if (!mbClient) {
    mbClient = await createMBClient({
      FirstName: payload.contact?.firstName ?? payload.firstName ?? "",
      LastName: payload.contact?.lastName ?? payload.lastName ?? "",
      Email: email,
      MobilePhone: payload.contact?.phone ?? payload.phone ?? "",
    });
    console.log(`[HL→MB] created new MB client for ${email}: ${mbClient.Id}`);
  }

  // For each product in the order, check if it maps to a MB service
  for (const product of payload.products ?? []) {
    const mbServiceId = getMBServiceIdForHLProduct(product.productId, product.name);
    if (mbServiceId) {
      await addServiceToClient({
        ClientId: mbClient.Id,
        ServiceId: mbServiceId,
        LocationId: MB_DEFAULT_LOCATION_ID,
      });
      console.log(
        `[HL→MB] OrderCreate: added MB service ${mbServiceId} to client ${mbClient.Id} (${email}) for product "${product.name}"`
      );
    } else {
      console.log(
        `[HL→MB] OrderCreate: no MB service mapping for HL product "${product.name}" — skipping`
      );
    }
  }
}

// ── Router ────────────────────────────────────────────────────────────────────
export async function routeHighLevelEvent(payload: HLWebhookPayload) {
  switch (payload.type) {
    case "AppointmentCreate":
      return handleHLAppointmentCreate(payload);
    case "OrderCreate":
    case "InvoicePaid":
      return handleHLOrderCreate(payload);
    default:
      console.log(`[HL→MB] unhandled HL event type: ${payload.type}`);
  }
}

// ── Product → MB service mapping ─────────────────────────────────────────────
// Map HL product IDs or names to Mindbody service IDs.
// Add rows here as you sell new products in HighLevel that should provision
// a service in Mindbody.
function getMBServiceIdForHLProduct(
  productId: string,
  productName: string
): number | null {
  // Look up by product ID first (most reliable)
  const byId: Record<string, number> = {
    // e.g. "hl_prod_abc123": 1001
    [process.env.HL_PRODUCT_MONTHLY_ID ?? ""]: parseInt(process.env.MB_SERVICE_MONTHLY_ID ?? "0"),
    [process.env.HL_PRODUCT_ANNUAL_ID ?? ""]: parseInt(process.env.MB_SERVICE_ANNUAL_ID ?? "0"),
    [process.env.HL_PRODUCT_10PACK_ID ?? ""]: parseInt(process.env.MB_SERVICE_10PACK_ID ?? "0"),
    [process.env.HL_PRODUCT_PT_ID ?? ""]: parseInt(process.env.MB_SERVICE_PT_ID ?? "0"),
  };

  if (productId && byId[productId]) return byId[productId];

  // Fallback: match by product name substring
  const byName: Array<[string, number]> = [
    ["monthly", parseInt(process.env.MB_SERVICE_MONTHLY_ID ?? "0")],
    ["annual", parseInt(process.env.MB_SERVICE_ANNUAL_ID ?? "0")],
    ["10-class", parseInt(process.env.MB_SERVICE_10PACK_ID ?? "0")],
    ["10 class", parseInt(process.env.MB_SERVICE_10PACK_ID ?? "0")],
    ["personal training", parseInt(process.env.MB_SERVICE_PT_ID ?? "0")],
  ];

  const lower = productName.toLowerCase();
  for (const [keyword, serviceId] of byName) {
    if (lower.includes(keyword) && serviceId) return serviceId;
  }

  return null;
}
