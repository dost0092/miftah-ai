import { z } from "zod";
import { getAppSession } from "@/lib/workspace/session";
import { getPlan } from "@/lib/billing";
import { getStripe } from "@/lib/billing/stripe";
import { routing } from "@/i18n/routing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ locale: z.enum(routing.locales).catch("en").default("en") });

/** Opens the Stripe customer portal (change card, download invoices, cancel). */
export async function POST(req: Request) {
  const session = await getAppSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });
  const stripe = getStripe();
  if (!stripe) return Response.json({ error: "not_configured" }, { status: 503 });
  const { locale } = Body.parse(await req.json().catch(() => ({})));
  const plan = await getPlan(session);
  if (!plan.customerId) return Response.json({ error: "no_customer" }, { status: 404 });
  try {
    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
    const portal = await stripe.billingPortal.sessions.create({ customer: plan.customerId, return_url: `${origin}/${locale}/app/billing` });
    return Response.json({ url: portal.url });
  } catch (err) {
    console.error("stripe portal", err instanceof Error ? err.message : err);
    return Response.json({ error: "stripe" }, { status: 502 });
  }
}
