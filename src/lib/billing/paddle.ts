import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getServerSupabase } from "@/lib/supabase";

/**
 * Paddle Billing (merchant of record). Paddle sells the subscription, charges VAT and pays out.
 *
 * Env:
 *   PADDLE_ENV             "sandbox" (test) or "production"
 *   PADDLE_CLIENT_TOKEN    client-side token (Paddle → Developer tools → Authentication), safe to send to the browser
 *   PADDLE_PRICE_ID        price of Miftah AI Pro (pri_…)
 *   PADDLE_API_KEY         server API key, used for the customer portal
 *   PADDLE_WEBHOOK_SECRET  secret key of the notification destination pointing at /api/billing/webhook
 */
export function paddleEnv(): "sandbox" | "production" {
  return process.env.PADDLE_ENV?.trim() === "production" ? "production" : "sandbox";
}

export function paddleCheckoutConfig() {
  const token = process.env.PADDLE_CLIENT_TOKEN?.trim();
  const priceId = process.env.PADDLE_PRICE_ID?.trim();
  if (!token || !priceId) return null;
  return { token, priceId, environment: paddleEnv() };
}

function apiBase() {
  return paddleEnv() === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";
}

/** Verifies the Paddle-Signature header ("ts=…;h1=…") over `${ts}:${rawBody}`. */
export function verifyPaddleSignature(rawBody: string, header: string | null, secret: string, toleranceSec = 300): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(";").map((p) => p.split("=") as [string, string]));
  const ts = parts.ts;
  const h1 = parts.h1;
  if (!ts || !h1) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > toleranceSec) return false;
  const expected = createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(h1, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export type PaddleSubscription = {
  id: string;
  status: string; // active | trialing | past_due | paused | canceled
  customer_id: string;
  custom_data?: { user_id?: string } | null;
  current_billing_period?: { starts_at: string; ends_at: string } | null;
  scheduled_change?: { action: "cancel" | "pause" | "resume"; effective_at: string } | null;
};

/** Writes the state of a Paddle subscription to the subscriptions table. */
export async function syncSubscription(sub: PaddleSubscription) {
  const db = getServerSupabase();
  if (!db) throw new Error("Supabase not configured");
  let userId = sub.custom_data?.user_id ?? null;
  if (!userId) {
    const { data } = await db.from("subscriptions").select("user_id").or(`subscription_id.eq.${sub.id},customer_id.eq.${sub.customer_id}`).limit(1).maybeSingle();
    userId = data?.user_id ?? null;
  }
  if (!userId) {
    console.warn("paddle: subscription without a known user", sub.id);
    return;
  }
  const live = ["active", "trialing", "past_due"].includes(sub.status);
  const { error } = await db.from("subscriptions").upsert(
    {
      user_id: userId,
      provider: "paddle",
      plan: live ? "pro" : "free",
      status: sub.status,
      customer_id: sub.customer_id,
      subscription_id: sub.id,
      current_period_end: sub.current_billing_period?.ends_at ?? null,
      cancel_at_period_end: sub.scheduled_change?.action === "cancel",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(`subscription upsert failed: ${error.message}`);
}

/** A one-time link to Paddle's customer portal (update card, invoices, cancel). */
export async function portalUrl(customerId: string, subscriptionId: string | null): Promise<string | null> {
  const key = process.env.PADDLE_API_KEY?.trim();
  if (!key) return null;
  const res = await fetch(`${apiBase()}/customers/${encodeURIComponent(customerId)}/portal-sessions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(subscriptionId ? { subscription_ids: [subscriptionId] } : {}),
  });
  if (!res.ok) {
    console.error("paddle portal", res.status, (await res.text().catch(() => "")).slice(0, 200));
    return null;
  }
  const j = (await res.json()) as { data?: { urls?: { general?: { overview?: string } } } };
  return j.data?.urls?.general?.overview ?? null;
}
