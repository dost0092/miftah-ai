import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Account data store.
 * The source of truth is the user's own auth metadata, which always exists and needs no
 * extra tables. When the optional `profiles` / `saved_districts` tables exist
 * (supabase/migrations/0002_accounts.sql), they are kept in sync for reporting.
 */

export type Profile = { full_name: string | null; nationality: string | null; city: string | null; preferred_language: string | null };

export function profileFromUser(user: User | null | undefined): Profile {
  const m = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const str = (k: string) => (typeof m[k] === "string" && m[k] ? (m[k] as string) : null);
  return { full_name: str("full_name"), nationality: str("nationality"), city: str("city"), preferred_language: str("preferred_language") };
}

export function savedFromUser(user: User | null | undefined): string[] {
  const v = (user?.user_metadata as Record<string, unknown> | undefined)?.saved_districts;
  return Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];
}

export async function saveProfile(supabase: SupabaseClient, profile: Profile): Promise<{ ok: boolean }> {
  const { data, error } = await supabase.auth.updateUser({ data: profile });
  if (error || !data.user) return { ok: false };
  // Best-effort mirror into the profiles table (ignored if the table does not exist).
  await supabase.from("profiles").upsert({ id: data.user.id, ...profile, updated_at: new Date().toISOString() });
  return { ok: true };
}

export async function setSaved(supabase: SupabaseClient, user: User, slug: string, save: boolean): Promise<{ ok: boolean; list: string[] }> {
  const current = savedFromUser(user);
  const list = save ? Array.from(new Set([slug, ...current])) : current.filter((s) => s !== slug);
  const { error } = await supabase.auth.updateUser({ data: { saved_districts: list } });
  if (error) return { ok: false, list: current };
  if (save) await supabase.from("saved_districts").upsert({ user_id: user.id, district_slug: slug });
  else await supabase.from("saved_districts").delete().eq("user_id", user.id).eq("district_slug", slug);
  return { ok: true, list };
}
