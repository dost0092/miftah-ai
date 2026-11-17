import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  company: z.string().trim().max(160).optional().default(""),
  topic: z.enum(["general", "broker", "data", "press", "other"]),
  message: z.string().trim().min(5).max(4000),
  language: z.string().max(5).optional().default("en"),
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
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  const { website: _honeypot, ...row } = parsed.data;

  const supabase = getServerSupabase();
  if (!supabase) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[contact] Supabase env vars missing — message not stored from:", row.email);
      return NextResponse.json({ ok: true, stored: false });
    }
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const { error } = await supabase.from("contact_messages").insert(row);
  if (error) {
    console.error("[contact] insert failed", error.message);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, stored: true });
}
