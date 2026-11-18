import "server-only";
import type { AppSession } from "./session";

/**
 * Per-user workspace data: activity log, AI chat threads and saved reports.
 * Backed by Supabase tables (supabase/migrations/0003_workspace.sql) with row-level security.
 * In local preview mode it falls back to process memory. If the tables are not created yet,
 * reads return empty lists and writes are skipped, so the app never breaks.
 */

export type ActivityKind = "search" | "map_view" | "chat" | "report" | "calc";
export type Activity = { id: number; kind: ActivityKind; title: string; href: string | null; meta: Record<string, unknown>; created_at: string };
export type ChatSource = { n: number; title: string; url: string; status: string; source: string; excerpt: string; kind: "rule" | "data" };
export type ChatThread = { id: string; title: string; created_at: string; updated_at: string };
export type ChatMessage = { id: number; role: "user" | "assistant"; content: string; sources: ChatSource[]; created_at: string };
export type ReportType = "district" | "due_diligence" | "cost";
export type UserReport = { id: string; type: ReportType; title: string; district_slug: string | null; params: Record<string, unknown>; created_at: string };

type Mem = { activity: Activity[]; threads: (ChatThread & { messages: ChatMessage[] })[]; reports: UserReport[]; seq: number };
const g = globalThis as unknown as { __miftahMem?: Map<string, Mem> };
function mem(userId: string): Mem {
  g.__miftahMem ??= new Map();
  let m = g.__miftahMem.get(userId);
  if (!m) {
    m = { activity: [], threads: [], reports: [], seq: 1 };
    g.__miftahMem.set(userId, m);
  }
  return m;
}
const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

// ───────────────────────── Activity ─────────────────────────

export async function logActivity(s: AppSession, a: { kind: ActivityKind; title: string; href?: string; meta?: Record<string, unknown> }) {
  const row = { kind: a.kind, title: a.title.slice(0, 200), href: a.href ?? null, meta: a.meta ?? {} };
  if (!s.db) {
    const m = mem(s.user.id);
    m.activity.unshift({ id: m.seq++, created_at: now(), ...row });
    return;
  }
  await s.db.from("activity").insert({ user_id: s.user.id, ...row });
}

export async function recentActivity(s: AppSession, limit = 8, kinds?: ActivityKind[]): Promise<Activity[]> {
  if (!s.db) return mem(s.user.id).activity.filter((a) => !kinds || kinds.includes(a.kind)).slice(0, limit);
  let q = s.db.from("activity").select("id, kind, title, href, meta, created_at").eq("user_id", s.user.id).order("created_at", { ascending: false }).limit(limit);
  if (kinds) q = q.in("kind", kinds);
  const { data } = await q;
  return (data as Activity[] | null) ?? [];
}

export async function activityCounts(s: AppSession, sinceIso?: string): Promise<Record<ActivityKind, number>> {
  const kinds: ActivityKind[] = ["search", "map_view", "chat", "report", "calc"];
  const out = Object.fromEntries(kinds.map((k) => [k, 0])) as Record<ActivityKind, number>;
  if (!s.db) {
    for (const a of mem(s.user.id).activity) if (!sinceIso || a.created_at >= sinceIso) out[a.kind]++;
    return out;
  }
  await Promise.all(
    kinds.map(async (k) => {
      let q = s.db!.from("activity").select("id", { count: "exact", head: true }).eq("user_id", s.user.id).eq("kind", k);
      if (sinceIso) q = q.gte("created_at", sinceIso);
      const { count } = await q;
      out[k] = count ?? 0;
    }),
  );
  return out;
}

/** Daily activity counts for the last `days` days (oldest first). */
export async function activityByDay(s: AppSession, days = 14): Promise<{ day: string; count: number }[]> {
  const since = new Date(Date.now() - (days - 1) * 86400000);
  since.setUTCHours(0, 0, 0, 0);
  let rows: { created_at: string }[] = [];
  if (!s.db) rows = mem(s.user.id).activity.filter((a) => a.created_at >= since.toISOString());
  else {
    const { data } = await s.db.from("activity").select("created_at").eq("user_id", s.user.id).gte("created_at", since.toISOString()).limit(5000);
    rows = data ?? [];
  }
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) buckets.set(new Date(since.getTime() + i * 86400000).toISOString().slice(0, 10), 0);
  for (const r of rows) {
    const k = r.created_at.slice(0, 10);
    if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1);
  }
  return [...buckets].map(([day, count]) => ({ day, count }));
}

// ───────────────────────── Chat ─────────────────────────

export async function listThreads(s: AppSession, limit = 30): Promise<ChatThread[]> {
  if (!s.db) return mem(s.user.id).threads.map(({ messages: _m, ...t }) => t).sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, limit);
  const { data } = await s.db.from("chat_threads").select("id, title, created_at, updated_at").eq("user_id", s.user.id).order("updated_at", { ascending: false }).limit(limit);
  return (data as ChatThread[] | null) ?? [];
}

export async function getThread(s: AppSession, id: string): Promise<{ thread: ChatThread; messages: ChatMessage[] } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  if (!s.db) {
    const t = mem(s.user.id).threads.find((x) => x.id === id);
    if (!t) return null;
    const { messages, ...thread } = t;
    return { thread, messages };
  }
  const { data: thread } = await s.db.from("chat_threads").select("id, title, created_at, updated_at").eq("id", id).eq("user_id", s.user.id).maybeSingle();
  if (!thread) return null;
  const { data: messages } = await s.db.from("chat_messages").select("id, role, content, sources, created_at").eq("thread_id", id).order("id").limit(200);
  return { thread: thread as ChatThread, messages: (messages as ChatMessage[] | null) ?? [] };
}

export async function createThread(s: AppSession, title: string): Promise<string | null> {
  const t = { title: title.slice(0, 120) || "New conversation" };
  if (!s.db) {
    const id = uuid();
    mem(s.user.id).threads.push({ id, ...t, created_at: now(), updated_at: now(), messages: [] });
    return id;
  }
  const { data, error } = await s.db.from("chat_threads").insert({ user_id: s.user.id, ...t }).select("id").single();
  return error ? null : (data.id as string);
}

export async function addMessage(s: AppSession, threadId: string, role: "user" | "assistant", content: string, sources: ChatSource[] = []) {
  if (!s.db) {
    const m = mem(s.user.id);
    const t = m.threads.find((x) => x.id === threadId);
    if (!t) return;
    t.messages.push({ id: m.seq++, role, content, sources, created_at: now() });
    t.updated_at = now();
    return;
  }
  await s.db.from("chat_messages").insert({ thread_id: threadId, user_id: s.user.id, role, content, sources });
  await s.db.from("chat_threads").update({ updated_at: now() }).eq("id", threadId).eq("user_id", s.user.id);
}

export async function deleteThread(s: AppSession, id: string) {
  if (!s.db) {
    const m = mem(s.user.id);
    m.threads = m.threads.filter((t) => t.id !== id);
    return;
  }
  await s.db.from("chat_threads").delete().eq("id", id).eq("user_id", s.user.id);
}

// ───────────────────────── Reports ─────────────────────────

export async function listReports(s: AppSession): Promise<UserReport[]> {
  if (!s.db) return mem(s.user.id).reports;
  const { data } = await s.db.from("user_reports").select("id, type, title, district_slug, params, created_at").eq("user_id", s.user.id).order("created_at", { ascending: false }).limit(200);
  return (data as UserReport[] | null) ?? [];
}

export async function getReport(s: AppSession, id: string): Promise<UserReport | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  if (!s.db) return mem(s.user.id).reports.find((r) => r.id === id) ?? null;
  const { data } = await s.db.from("user_reports").select("id, type, title, district_slug, params, created_at").eq("id", id).eq("user_id", s.user.id).maybeSingle();
  return (data as UserReport | null) ?? null;
}

export async function createReport(s: AppSession, r: { type: ReportType; title: string; district_slug: string | null; params: Record<string, unknown> }): Promise<string | null> {
  if (!s.db) {
    const id = uuid();
    mem(s.user.id).reports.unshift({ id, created_at: now(), ...r });
    return id;
  }
  const { data, error } = await s.db.from("user_reports").insert({ user_id: s.user.id, ...r }).select("id").single();
  return error ? null : (data.id as string);
}

export async function deleteReport(s: AppSession, id: string) {
  if (!s.db) {
    const m = mem(s.user.id);
    m.reports = m.reports.filter((r) => r.id !== id);
    return;
  }
  await s.db.from("user_reports").delete().eq("id", id).eq("user_id", s.user.id);
}
