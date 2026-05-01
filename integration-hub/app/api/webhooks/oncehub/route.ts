import { NextRequest, NextResponse } from "next/server";
import { routeOncehubEvent } from "@/lib/handlers/oncehub-to-highlevel";
import type { OncehubWebhookPayload } from "@/lib/types/oncehub";
import crypto from "crypto";

// Oncehub sends HMAC-SHA256 in the X-OnceHub-Signature header
function verifySignature(body: string, signature: string): boolean {
  if (process.env.SKIP_WEBHOOK_VERIFICATION === "true") return true;
  const secret = process.env.ONCEHUB_WEBHOOK_SECRET;
  if (!secret) return true;

  const expected = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex")}`;

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
  const signature = req.headers.get("x-oncehub-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    console.warn("[OH webhook] invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: OncehubWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    await routeOncehubEvent(payload);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[OH webhook] handler error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 200 }
    );
  }
}
