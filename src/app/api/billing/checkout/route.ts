import { z } from "zod";
import { getAppSession } from "@/lib/workspace/session";
import { getServerSupabase } from "@/lib/supabase";
import { getPlan } from "@/lib/billing";
import { getStripe, proLineItem } from "@/lib/billing/stripe";
import { routing } from "@/i18n/routing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ locale: z.enum(routing.locales).catch("en").default("en") });

/** Starts a Stripe Checkout session for Miftah AI Pro and returns its URL. */
export async function POST(req: Request) {
  const session = await getAppSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });
  const stripe = getStripe();
  const db = getServerSupabase();
  if (!stripe || !db || session.preview) return Response.json({ error: "not_configured" }, { status: 503 });
  const { locale } = Body.parse(await req.json().catch(() => ({})));

  const plan = await getPlan(session);
  if (plan.plan === "pro") return Response.json({ error: "already_pro" }, { status: 409 });

  try {
    // Reuse the Stripe customer if this user already has one.
    let customerId = plan.customerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email ?? undefined,
        name: session.profile.full_name || undefined,
        metadata: { user_id: session.user.id },
      });
      customerId = customer.id;
      await db.from("subscriptions").upsert({ user_id: session.user.id, stripe_customer_id: customerId, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: session.user.id,
      line_items: [proLineItem()],
      subscription_data: { metadata: { user_id: session.user.id } },
      allow_promotion_codes: true,
      locale: locale === "zh" ? "zh" : "auto",
      success_url: `${origin}/${locale}/app/billing?status=success`,
      cancel_url: `${origin}/${locale}/app/billing?status=cancelled`,
    });
    return Response.json({ url: checkout.url });
  } catch (err) {
    console.error("stripe checkout", err instanceof Error ? err.message : err);
    return Response.json({ error: "stripe" }, { status: 502 });
  }
}
