import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createCookieSupabase } from "@/lib/supabase-auth";
import { notifyTeam } from "@/lib/notify";

/**
 * Handles links from Supabase emails (account confirmation, password reset) and OAuth
 * sign-in: exchanges the one-time code for a session cookie, then sends the user on.
 */
export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/en/app";
  // Only allow same-site relative redirects.
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/en/app";

  if (code) {
    const store = await cookies();
    const supabase = createCookieSupabase(store);
    const result = await supabase?.auth.exchangeCodeForSession(code);
    if (result && !result.error) {
      const user = result.data.user;
      // Confirmation link of a brand-new account: tell the team.
      if (searchParams.get("new") === "1" && user && Date.now() - new Date(user.created_at).getTime() < 3 * 24 * 3600 * 1000) {
        await notifyTeam("New account created", {
          Email: user.email,
          Name: (user.user_metadata?.full_name as string | undefined) ?? "",
          Language: (user.user_metadata?.preferred_language as string | undefined) ?? "",
        });
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  const locale = next.split("/")[1] || "en";
  return NextResponse.redirect(`${origin}/${locale}/login?error=link`);
}
