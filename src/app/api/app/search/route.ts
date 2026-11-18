import { getAppSession } from "@/lib/workspace/session";
import { districts } from "@/lib/districts";
import { searchKnowledge } from "@/lib/workspace/library";

/** Global workspace search: districts by name and official documents by content. */
export async function GET(req: Request) {
  const session = await getAppSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 200);
  if (q.length < 2) return Response.json({ districts: [], documents: [] });
  const lq = q.toLowerCase();
  const ds = districts
    .filter((d) => d.nameEn.toLowerCase().includes(lq) || d.nameAr.includes(q) || d.slug.includes(lq.replace(/\s+/g, "-")) || d.city.includes(lq))
    .slice(0, 6)
    .map((d) => ({ slug: d.slug, nameEn: d.nameEn, nameAr: d.nameAr, city: d.city }));
  const { hits } = await searchKnowledge(q, 10);
  const seen = new Set<string>();
  const documents = hits.filter((h) => !seen.has(h.docId) && seen.add(h.docId)).slice(0, 5).map((h) => ({ id: h.docId, title: h.title, category: h.category, excerpt: h.content.slice(0, 140) }));
  return Response.json({ districts: ds, documents });
}
