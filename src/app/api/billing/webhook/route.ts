import type Stripe from "stripe";
import { getStripe, syncSubscription } from "@/lib/billing/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Stripe webhook: keeps the subscriptions table in step with Stripe. Verified with STRIPE_WEBHOOK_SECRET. */
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return Response.json({ error: "not_configured" }, { status: 503 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "signature" }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return Response.json({ error: "signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.mode === "subscription" && s.subscription) {
          const sub = await stripe.subscriptions.retrieve(typeof s.subscription === "string" ? s.subscription : s.subscription.id);
          await syncSubscription(sub, s.client_reference_id);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
    }
  } catch (err) {
    console.error("stripe webhook", event.type, err instanceof Error ? err.message : err);
    return Response.json({ error: "processing" }, { status: 500 });
  }
  return Response.json({ received: true });
}
