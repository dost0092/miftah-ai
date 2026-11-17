import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createCookieSupabase } from "@/lib/supabase-auth";
import { notifyTeam } from "@/lib/notify";

/** Called once by the sign-up form after a successful sign-up, to notify the team. */
export async function POST() {
  const supabase = createCookieSupabase(await cookies());
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  const user = data.user;
  if (!user?.email) return NextResponse.json({ ok: false }, { status: 401 });

  // Only notify for brand-new accounts, so this endpoint cannot be used to resend emails.
  const ageMs = Date.now() - new Date(user.created_at).getTime();
  if (ageMs > 10 * 60 * 1000) return NextResponse.json({ ok: true, notified: false });

  await notifyTeam("New account created", {
    Email: user.email,
    Name: (user.user_metadata?.full_name as string | undefined) ?? "",
    Language: (user.user_metadata?.preferred_language as string | undefined) ?? "",
  });
  return NextResponse.json({ ok: true, notified: true });
}
