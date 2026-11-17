import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** Reports whether Supabase is configured and the tables exist. Never returns secrets or rows. */
export async function GET() {
  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, supabase: "not_configured" }, { status: 503 });
  }
  const tables: Record<string, "ok" | "missing" | "error"> = {};
  for (const table of ["waitlist", "contact_messages", "districts"]) {
    // A normal (non-HEAD) read: HEAD requests drop the error body and can hide "table not found".
    const { error } = await supabase.from(table).select("*").limit(0);
    tables[table] = !error ? "ok" : error.code === "42P01" || error.code === "PGRST205" ? "missing" : "error";
  }
  const ok = Object.values(tables).every((v) => v === "ok");
  return NextResponse.json({ ok, supabase: "connected", tables }, { status: ok ? 200 : 500 });
}
