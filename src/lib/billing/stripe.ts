import "server-only";
import Stripe from "stripe";
import { getServerSupabase } from "@/lib/supabase";
import { PRO_PRICE_SAR } from "./index";

let client: Stripe | null = null;

/** Stripe client, or null until STRIPE_SECRET_KEY is set. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return (client ??= new Stripe(key));
}

/** Checkout line item: a configured Price if STRIPE_PRICE_ID is set, otherwise SAR 99 / month defined inline. */
export function proLineItem(): Stripe.Checkout.SessionCreateParams.LineItem {
  const price = process.env.STRIPE_PRICE_ID?.trim();
  if (price) return { price, quantity: 1 };
  return {
    quantity: 1,
    price_data: {
      currency: "sar",
      unit_amount: PRO_PRICE_SAR * 100,
      recurring: { interval: "month" },
      product_data: { name: "Miftah AI Pro", description: "Unlimited Miftah AI questions and reports" },
    },
  };
}

/** Writes the state of a Stripe subscription to the subscriptions table. */
export async function syncSubscription(sub: Stripe.Subscription, userIdHint?: string | null) {
  const db = getServerSupabase();
  if (!db) throw new Error("Supabase not configured");
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  let userId = userIdHint || sub.metadata?.user_id || null;
  if (!userId) {
    const { data } = await db.from("subscriptions").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
    userId = data?.user_id ?? null;
  }
  if (!userId) {
    console.warn("stripe: subscription without a known user", sub.id);
    return;
  }
  const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
  const live = ["active", "trialing", "past_due"].includes(sub.status);
  const { error } = await db.from("subscriptions").upsert(
    {
      user_id: userId,
      plan: live ? "pro" : "free",
      status: sub.status,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: Boolean(sub.cancel_at_period_end),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(`subscription upsert failed: ${error.message}`);
}
