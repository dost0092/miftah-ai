import "server-only";
import { cache } from "react";
import { getServerSupabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase-auth";
import { officialSources, type OfficialSource } from "@/lib/official/sources";
import { knowledgeDocs, type KnowledgeDoc } from "@/lib/official/knowledge";
import { districts, type District } from "@/lib/districts";

/**
 * The official data library, read from Supabase (official_sources, knowledge_documents,
 * knowledge_chunks). If the tables are not loaded yet the bundled seed files are used, so the
 * app shows the same content either way. `origin` says which one answered.
 */

export type Origin = "database" | "bundled";
export type Hit = { docId: string; ord: number; content: string; rank: number; title: string; category: string; url: string; status: string; source: string };

function readClient() {
  const admin = getServerSupabase();
  if (admin) return admin;
  if (SUPABASE_URL && SUPABASE_ANON_KEY) return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  return null;
}

export const getLibrary = cache(async (): Promise<{ sources: OfficialSource[]; docs: KnowledgeDoc[]; origin: Origin }> => {
  const db = readClient();
  if (db) {
    const [s, d, c] = await Promise.all([
      db.from("official_sources").select("id, name, name_ar, publisher, url, kind, description"),
      db.from("knowledge_documents").select("id, title, title_ar, category, source_id, url, effective, checked, status, summary, keywords").order("category"),
      db.from("knowledge_chunks").select("document_id, ord, content").order("document_id").order("ord").limit(2000),
    ]);
    if (!s.error && !d.error && !c.error && d.data.length > 0) {
      const paras = new Map<string, string[]>();
      for (const row of c.data) paras.set(row.document_id, [...(paras.get(row.document_id) ?? []), row.content]);
      return {
        origin: "database",
        sources: s.data.map((r) => ({ id: r.id, name: r.name, nameAr: r.name_ar ?? "", publisher: r.publisher ?? "", url: r.url, kind: r.kind, description: r.description ?? "" })),
        docs: d.data.map((r) => ({
          id: r.id, title: r.title, titleAr: r.title_ar ?? "", category: r.category, sourceId: r.source_id, url: r.url,
          effective: r.effective, checked: r.checked, status: r.status, summary: r.summary ?? "", keywords: r.keywords ?? [], paragraphs: paras.get(r.id) ?? [],
        })),
      };
    }
  }
  return { sources: officialSources, docs: knowledgeDocs, origin: "bundled" };
});

const STOP = new Set(
  "a an the and or but if of to in on at for from by with about as is are was were be been being do does did can could should would will may might must i me my we our you your it its this that these those what which who whom how when where why there here than then so not no yes any some all into over under up down out off very just also please tell know want need get got have has had buy buying sell selling property properties saudi arabia ksa".split(" "),
);

/** Question → safe OR-query terms for Postgres (letters/digits only). */
export function searchTerms(question: string): string[] {
  const words = question.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  return [...new Set(words.filter((w) => w.length > 1 && !STOP.has(w)))].slice(0, 16);
}

function bundledSearch(terms: string[], k: number): Hit[] {
  const sourceName = new Map(officialSources.map((s) => [s.id, s.name]));
  const hits: Hit[] = [];
  for (const d of knowledgeDocs) {
    const head = `${d.title} ${d.titleAr} ${d.keywords.join(" ")}`.toLowerCase();
    d.paragraphs.forEach((p, ord) => {
      const body = p.toLowerCase();
      let rank = 0;
      for (const t of terms) {
        const stem = t.length > 4 ? t.replace(/(ing|ers|er|es|s)$/u, "") : t;
        if (body.includes(stem)) rank += 1;
        if (head.includes(stem)) rank += 0.6;
      }
      if (rank > 0) hits.push({ docId: d.id, ord, content: p, rank, title: d.title, category: d.category, url: d.url, status: d.status, source: sourceName.get(d.sourceId) ?? "" });
    });
  }
  return hits.sort((a, b) => b.rank - a.rank || a.ord - b.ord).slice(0, k);
}

/** Retrieve the most relevant official passages for a question (RAG retrieval step). */
export async function searchKnowledge(question: string, k = 6): Promise<{ hits: Hit[]; origin: Origin }> {
  const terms = searchTerms(question);
  if (terms.length === 0) return { hits: [], origin: "bundled" };
  const db = readClient();
  if (db) {
    const { data, error } = await db.rpc("search_knowledge", { terms: terms.join(" | "), match_count: k });
    if (!error && Array.isArray(data)) {
      return {
        origin: "database",
        hits: data.map((r) => ({ docId: r.document_id, ord: r.ord, content: r.content, rank: r.rank, title: r.title, category: r.category, url: r.url, status: r.status, source: r.source_name ?? "" })),
      };
    }
  }
  return { hits: bundledSearch(terms, k), origin: "bundled" };
}

/** Districts mentioned in a piece of text (English or Arabic names, or slugs). */
export function findDistricts(text: string): District[] {
  const t = text.toLowerCase();
  const norm = t.replace(/[-_]/g, " ");
  const found = districts.filter((d) => {
    const en = d.nameEn.toLowerCase();
    const bare = en.replace(/^al /, "");
    return norm.includes(en) || (bare.length > 4 && new RegExp(`\\b${bare}\\b`).test(norm)) || text.includes(d.nameAr) || t.includes(d.slug);
  });
  // "Al Rawdah" exists in both cities; prefer the city mentioned, if any.
  const city = /jeddah|jedda|جدة/.test(t) ? "jeddah" : /riyadh|الرياض/.test(t) ? "riyadh" : null;
  const scoped = city ? found.filter((d) => d.city === city) : found;
  return (scoped.length ? scoped : found).slice(0, 3);
}
