import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { aiProvider, openRouterKeys, openRouterModels } from "@/lib/workspace/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The AI check calls OpenRouter's free key-info endpoint (no tokens used); cache it briefly.
let aiCache: { at: number; value: unknown } | null = null;

async function aiStatus() {
  if (aiCache && Date.now() - aiCache.at < 5 * 60_000) return aiCache.value as { ok: boolean };
  const provider = aiProvider();
  const keys = openRouterKeys();
  const checks = await Promise.all(
    keys.map(async (key, i) => {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/key", { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(8000) });
        return { key: i + 1, ok: res.ok, status: res.status };
      } catch {
        return { key: i + 1, ok: false, status: 0 };
      }
    }),
  );
  const value = { ok: provider === "anthropic" || checks.some((c) => c.ok), provider: provider ?? "library", openrouterKeys: keys.length, models: openRouterModels(), checks };
  aiCache = { at: Date.now(), value };
  return value;
}

/**
 * Reports whether Supabase is configured and the tables exist, and whether the AI keys are accepted.
 * Never returns secrets, key values or rows.
 */
export async function GET() {
  const supabase = getServerSupabase();
  const ai = await aiStatus();
  if (!supabase) {
    return NextResponse.json({ ok: false, supabase: "not_configured", ai }, { status: 503 });
  }
  const tables: Record<string, "ok" | "missing" | "error"> = {};
  for (const table of ["waitlist", "contact_messages", "districts", "knowledge_chunks", "chat_threads", "chat_messages", "activity", "user_reports"]) {
    // A normal (non-HEAD) read: HEAD requests drop the error body and can hide "table not found".
    const { error } = await supabase.from(table).select("*").limit(0);
    tables[table] = !error ? "ok" : error.code === "42P01" || error.code === "PGRST205" ? "missing" : "error";
  }
  const ok = Object.values(tables).every((v) => v === "ok") && ai.ok;
  return NextResponse.json({ ok, supabase: "connected", tables, ai }, { status: ok ? 200 : 500 });
}
