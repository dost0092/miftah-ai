import { syncSubscription, verifyPaddleSignature, type PaddleSubscription } from "@/lib/billing/paddle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Paddle webhook: keeps the subscriptions table in step with Paddle. Verified with PADDLE_WEBHOOK_SECRET. */
export async function POST(req: Request) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET?.trim();
  if (!secret) return Response.json({ error: "not_configured" }, { status: 503 });

  const raw = await req.text();
  if (!verifyPaddleSignature(raw, req.headers.get("paddle-signature"), secret)) {
    return Response.json({ error: "signature" }, { status: 400 });
  }

  let event: { event_type?: string; data?: unknown };
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  try {
    if (event.event_type?.startsWith("subscription.")) {
      await syncSubscription(event.data as PaddleSubscription);
    }
  } catch (err) {
    console.error("paddle webhook", event.event_type, err instanceof Error ? err.message : err);
    return Response.json({ error: "processing" }, { status: 500 });
  }
  return Response.json({ received: true });
}
