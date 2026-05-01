import { NextRequest, NextResponse } from "next/server";
import { routeTrainerizeEvent } from "@/lib/handlers/trainerize-to-highlevel";
import type { TrainerizeWebhookPayload } from "@/lib/types/trainerize";
import crypto from "crypto";

function verifySignature(body: string, signature: string): boolean {
  if (process.env.SKIP_WEBHOOK_VERIFICATION === "true") return true;
  const secret = process.env.TRAINERIZE_WEBHOOK_SECRET;
  if (!secret) return true;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-trainerize-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    console.warn("[TZ webhook] invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: TrainerizeWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    await routeTrainerizeEvent(payload);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[TZ webhook] handler error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 200 }
    );
  }
}
