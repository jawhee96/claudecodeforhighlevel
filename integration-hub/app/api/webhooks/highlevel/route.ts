import { NextRequest, NextResponse } from "next/server";
import { routeHighLevelEvent } from "@/lib/handlers/highlevel-to-mindbody";
import type { HLWebhookPayload } from "@/lib/types/highlevel";
import crypto from "crypto";

function verifySignature(body: string, signature: string): boolean {
  if (process.env.SKIP_WEBHOOK_VERIFICATION === "true") return true;
  const secret = process.env.HIGHLEVEL_WEBHOOK_SECRET;
  if (!secret) return true;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-highlevel-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    console.warn("[HL webhook] invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: HLWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only process events relevant to Mindbody sync
  const relevantTypes = ["AppointmentCreate", "OrderCreate", "InvoicePaid"];
  if (!relevantTypes.includes(payload.type)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    await routeHighLevelEvent(payload);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[HL webhook] handler error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 200 }
    );
  }
}
