import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createCookieSupabase } from "@/lib/supabase-auth";
import { profileFromUser, type Profile } from "@/lib/account-store";

export type AppSession = {
  user: User;
  profile: Profile;
  /** Supabase client acting as the user (RLS applies). Null in local preview mode. */
  db: SupabaseClient | null;
  /** Local preview without Supabase: data is kept in server memory only. */
  preview: boolean;
};

/**
 * Local design preview: `APP_DEV_PREVIEW=1 npm run dev` opens the workspace without signing in.
 * Never active in production builds.
 */
const previewEnabled = process.env.NODE_ENV !== "production" && process.env.APP_DEV_PREVIEW === "1";

const previewUser = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "preview@miftahai.co",
  created_at: "2026-09-01T09:00:00.000Z",
  app_metadata: {},
  aud: "authenticated",
  user_metadata: { full_name: "Preview User", city: "riyadh", nationality: "Pakistani", preferred_language: "en" },
} as unknown as User;

/** The signed-in user for this request, or null. Cached per request. */
export const getAppSession = cache(async (): Promise<AppSession | null> => {
  const db = createCookieSupabase(await cookies());
  if (db) {
    const { data } = await db.auth.getUser();
    if (data.user) return { user: data.user, profile: profileFromUser(data.user), db, preview: false };
  }
  if (previewEnabled) return { user: previewUser, profile: profileFromUser(previewUser), db: null, preview: true };
  return null;
});

export function displayName(s: AppSession) {
  return s.profile.full_name?.trim() || s.user.email?.split("@")[0] || "";
}
