import { NextRequest, NextResponse } from "next/server";
import { routeMindbodyEvent } from "@/lib/handlers/mindbody-to-highlevel";
import type { MBWebhookPayload } from "@/lib/types/mindbody";
import crypto from "crypto";

function verifySignature(body: string, signature: string): boolean {
  if (process.env.SKIP_WEBHOOK_VERIFICATION === "true") return true;
  const secret = process.env.MINDBODY_WEBHOOK_SECRET;
  if (!secret) return true; // no secret configured → allow (warn in logs)

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
  const signature = req.headers.get("x-mindbody-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    console.warn("[MB webhook] invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: MBWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    await routeMindbodyEvent(payload);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[MB webhook] handler error:", err);
    // Return 200 so Mindbody doesn't retry indefinitely on handler errors
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 200 }
    );
  }
}
