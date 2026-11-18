import "server-only";

/**
 * True when Google sign-in is switched on in Supabase (Authentication → Providers → Google).
 * Read from Supabase's public auth settings, so the button appears on its own once enabled.
 * NEXT_PUBLIC_AUTH_GOOGLE=true forces it on.
 */
export async function googleAuthEnabled(): Promise<boolean> {
  if (process.env.NEXT_PUBLIC_AUTH_GOOGLE === "true") return true;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return false;
  try {
    const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key }, next: { revalidate: 600 } });
    if (!res.ok) return false;
    const data = (await res.json()) as { external?: { google?: boolean } };
    return Boolean(data.external?.google);
  } catch {
    return false;
  }
}
