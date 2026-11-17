import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase";
import { locales } from "@/i18n/routing";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  nationality: z.string().trim().max(80).optional().default(""),
  city: z.enum(["riyadh", "jeddah", "makkah", "madinah", "other"]),
  role: z.enum(["expat", "investor", "broker", "business", "other"]),
  language: z.enum(locales),
  question: z.string().trim().max(500).optional().default(""),
  consent: z.literal(true),
  // Honeypot: real users never fill this hidden field.
  website: z.string().max(0).optional().default(""),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }
  const { website: _honeypot, consent: _consent, ...row } = parsed.data;

  const supabase = getServerSupabase();
  if (!supabase) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[waitlist] Supabase env vars missing — signup not stored:", row.email);
      return NextResponse.json({ ok: true, stored: false });
    }
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const { error } = await supabase.from("waitlist").upsert(
    { ...row, source: req.headers.get("referer")?.slice(0, 300) ?? null },
    { onConflict: "email", ignoreDuplicates: false },
  );
  if (error) {
    console.error("[waitlist] insert failed", error.message);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, stored: true });
}
