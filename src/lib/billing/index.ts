import "server-only";
import { getServerSupabase } from "@/lib/supabase";
import type { AppSession } from "@/lib/workspace/session";

/** Plan limits. Free gets a monthly allowance; Pro is unlimited. */
export const FREE_LIMITS = { chat: 10, report: 1 } as const;
export const PRO_PRICE_SAR = 99;
export type UsageKind = keyof typeof FREE_LIMITS;

export type Plan = {
  plan: "free" | "pro";
  status: string;
  renewsAt: string | null;
  cancelAtPeriodEnd: boolean;
  customerId: string | null;
};

const FREE: Plan = { plan: "free", status: "inactive", renewsAt: null, cancelAtPeriodEnd: false, customerId: null };

// Local preview (no database): keep usage in memory.
const g = globalThis as unknown as { __usage?: Map<string, { kind: UsageKind; at: number }[]> };
const memUsage: Map<string, { kind: UsageKind; at: number }[]> = (g.__usage ??= new Map());

export function monthStart(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export async function getPlan(s: AppSession): Promise<Plan> {
  const db = s.preview ? null : getServerSupabase();
  if (!db) return FREE;
  const { data } = await db.from("subscriptions").select("plan, status, current_period_end, cancel_at_period_end, stripe_customer_id").eq("user_id", s.user.id).maybeSingle();
  if (!data) return FREE;
  const active = data.plan === "pro" && ["active", "trialing", "past_due"].includes(data.status);
  return {
    plan: active ? "pro" : "free",
    status: data.status,
    renewsAt: data.current_period_end,
    cancelAtPeriodEnd: Boolean(data.cancel_at_period_end),
    customerId: data.stripe_customer_id,
  };
}

export async function usageThisMonth(s: AppSession): Promise<Record<UsageKind, number>> {
  const since = monthStart();
  const out: Record<UsageKind, number> = { chat: 0, report: 0 };
  const db = s.preview ? null : getServerSupabase();
  if (!db) {
    for (const e of memUsage.get(s.user.id) ?? []) if (e.at >= since.getTime()) out[e.kind]++;
    return out;
  }
  await Promise.all(
    (Object.keys(out) as UsageKind[]).map(async (kind) => {
      const { count } = await db.from("usage_events").select("id", { count: "exact", head: true }).eq("user_id", s.user.id).eq("kind", kind).gte("created_at", since.toISOString());
      out[kind] = count ?? 0;
    }),
  );
  return out;
}

export type Allowance = { plan: Plan; used: Record<UsageKind, number>; limits: typeof FREE_LIMITS | null };

export async function getAllowance(s: AppSession): Promise<Allowance> {
  const [plan, used] = await Promise.all([getPlan(s), usageThisMonth(s)]);
  return { plan, used, limits: plan.plan === "pro" ? null : FREE_LIMITS };
}

/** True when the user may use one more of `kind` this month. */
export function canUse(a: Allowance, kind: UsageKind) {
  return !a.limits || a.used[kind] < a.limits[kind];
}

export async function recordUsage(s: AppSession, kind: UsageKind) {
  const db = s.preview ? null : getServerSupabase();
  if (!db) {
    const list = memUsage.get(s.user.id) ?? [];
    list.push({ kind, at: Date.now() });
    memUsage.set(s.user.id, list);
    return;
  }
  const { error } = await db.from("usage_events").insert({ user_id: s.user.id, kind });
  if (error) console.error("usage insert failed", error.message);
}
