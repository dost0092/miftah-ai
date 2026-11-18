import { getAppSession } from "@/lib/workspace/session";
import { getPlan } from "@/lib/billing";
import { portalUrl } from "@/lib/billing/paddle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Opens Paddle's customer portal (update card, download invoices, cancel). */
export async function POST() {
  const session = await getAppSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });
  const plan = await getPlan(session);
  if (!plan.customerId) return Response.json({ error: "no_customer" }, { status: 404 });
  const url = await portalUrl(plan.customerId, plan.subscriptionId);
  if (!url) return Response.json({ error: "not_configured" }, { status: 503 });
  return Response.json({ url });
}
