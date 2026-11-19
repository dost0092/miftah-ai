"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-auth";

export type SiteUser = { email?: string; name?: string };

/** Tracks the signed-in user on the public site (null = signed out, undefined = still checking). */
export function useUser(): SiteUser | null | undefined {
  const [user, setUser] = useState<SiteUser | null | undefined>(undefined);
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return setUser(null);
    const map = (u: { email?: string; user_metadata?: Record<string, unknown> } | null | undefined) =>
      u ? { email: u.email, name: (u.user_metadata?.full_name as string | undefined) ?? undefined } : null;
    supabase.auth.getSession().then(({ data }) => setUser(map(data.session?.user)));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(map(session?.user)));
    return () => data.subscription.unsubscribe();
  }, []);
  return user;
}

/** Opens the Miftah AI widget, optionally asking a question straight away. */
export function openMiftah(question?: string) {
  window.dispatchEvent(new CustomEvent("miftah:ask", { detail: { question } }));
}
