import { getAppSession } from "@/lib/workspace/session";
import { getPlan } from "@/lib/billing";
import { paddleCheckoutConfig } from "@/lib/billing/paddle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Everything the browser needs to open Paddle's overlay checkout for Miftah AI Pro.
 * The client token is public by design; the user id travels as custom data so the webhook can
 * attach the subscription to this account.
 */
export async function POST() {
  const session = await getAppSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });
  const config = paddleCheckoutConfig();
  if (!config || session.preview) return Response.json({ error: "not_configured" }, { status: 503 });
  const plan = await getPlan(session);
  if (plan.plan === "pro") return Response.json({ error: "already_pro" }, { status: 409 });
  return Response.json({ ...config, email: session.user.email ?? null, userId: session.user.id });
}
