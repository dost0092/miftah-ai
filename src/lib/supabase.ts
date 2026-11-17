import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Server-side Supabase client with elevated (service) access.
 * Only ever import this from route handlers / server code.
 *
 * Works with the variable names created by the Vercel ↔ Supabase integration
 * (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY) as well as the
 * NEXT_PUBLIC_SUPABASE_URL name used in .env.example.
 * Returns null when not configured so local dev works before Supabase is set up.
 */
export function getServerSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}
