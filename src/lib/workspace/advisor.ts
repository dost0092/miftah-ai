import "server-only";
import { DATA_UNTIL, IS_SAMPLE_DATA, QUARTERS, trendChange, type District } from "@/lib/districts";
import { feeRules } from "@/lib/fees";
import { findDistricts, searchKnowledge, type Hit } from "./library";
import type { ChatSource } from "./store";

/**
 * Retrieval step of the advisor (RAG): gathers the official passages and market figures a
 * question needs and numbers them [1], [2] … so the answer can cite each claim.
 */

export type Grounding = { sources: ChatSource[]; context: string; districts: District[]; hits: Hit[] };

const FEE_WORDS = /\b(fee|fees|cost|costs|tax|taxes|rett|vat|commission|budget|total|afford|price|prices|how much|closing)\b|رسوم|ضريبة|عمولة|تكلفة|سعر/i;
const FEE_LABEL: Record<string, string> = {
  rett: "Real Estate Transaction Tax (RETT)",
  brokerage: "Brokerage commission (default, negotiable in writing)",
  brokerageVat: "VAT on the brokerage commission",
  disposal: "Non-Saudi transaction fee (illustrative; confirm the current rate with REGA)",
};

function pct(n: number) {
  return `${+(n * 100).toFixed(2)}%`;
}

export async function ground(question: string, previous = ""): Promise<Grounding> {
  const { hits } = await searchKnowledge(`${question} ${previous}`.slice(0, 600), 6);
  const dists = findDistricts(question).length ? findDistricts(question) : findDistricts(previous);
  const sources: ChatSource[] = [];
  const blocks: string[] = [];

  // Keep at most two passages per document so several rules can be cited.
  const perDoc = new Map<string, number>();
  for (const h of hits) {
    const c = perDoc.get(h.docId) ?? 0;
    if (c >= 2) continue;
    perDoc.set(h.docId, c + 1);
    const n = sources.length + 1;
    sources.push({ n, kind: "rule", title: h.title, url: h.url, status: h.status, source: h.source, excerpt: h.content });
    blocks.push(`[${n}] ${h.title} — ${h.source} (${h.status === "verified" ? "verified" : h.status === "guidance" ? "Miftah guidance" : "summary, verify with source"})\n${h.content}`);
  }

  for (const d of dists) {
    const n = sources.length + 1;
    const change = trendChange(d);
    const sample = IS_SAMPLE_DATA ? " ILLUSTRATIVE SAMPLE DATA, not official figures" : "";
    const text =
      `District: ${d.nameEn} (${d.nameAr}), ${d.city === "riyadh" ? "Riyadh" : "Jeddah"}.${sample}\n` +
      `Median price per m², latest quarter ${QUARTERS[QUARTERS.length - 1]}: apartment SAR ${d.median.apartment.toLocaleString("en")}, villa SAR ${d.median.villa.toLocaleString("en")}, land SAR ${d.median.land.toLocaleString("en")}.\n` +
      `Registered deals last quarter: ${d.deals}. 12-month change (apartments): ${(change * 100).toFixed(1)}%. Data until ${DATA_UNTIL}.\n` +
      `Foreign ownership zone status: ${d.zone === "unknown" ? "NOT YET VERIFIED against REGA's zone list" : d.zone}.`;
    sources.push({ n, kind: "data", title: `Market data: ${d.nameEn}${IS_SAMPLE_DATA ? " (sample)" : ""}`, url: `/app/map?d=${d.slug}`, status: IS_SAMPLE_DATA ? "sample" : "verified", source: "MOJ transactions (Miftah AI pipeline)", excerpt: text });
    blocks.push(`[${n}] ${text}`);
  }

  if (FEE_WORDS.test(question) || dists.length) {
    const n = sources.length + 1;
    const text = "Transaction cost rates used by Miftah AI's calculator:\n" + feeRules.map((f) => `- ${FEE_LABEL[f.id]}: ${pct(f.rate)}${f.id === "brokerageVat" ? " of the commission" : " of the price"}, paid on ${f.appliesTo === "both" ? "purchase or sale" : f.appliesTo === "sell" ? "sale" : "purchase"}`).join("\n");
    sources.push({ n, kind: "data", title: "Transaction cost rates", url: "/app/calculator", status: "needs_review", source: "ZATCA / REGA", excerpt: text });
    blocks.push(`[${n}] ${text}`);
  }

  return { sources, context: blocks.join("\n\n"), districts: dists, hits };
}

export const SYSTEM_PROMPT = `You are Miftah AI, an advisor that helps foreigners understand buying property in Saudi Arabia.

You answer ONLY from the numbered sources provided with each question. Rules:
1. Every factual sentence must cite its source like [1] or [2][3]. Never cite a number that is not in the sources.
2. Use only figures that appear in the sources. Never estimate, extrapolate or invent a price, fee, date or legal rule.
3. If the sources do not answer the question, say so plainly, tell the user what is missing, and point them to the most relevant official body (REGA, ZATCA, MOJ/Najiz, Ejar). Do not fill gaps from general knowledge.
4. If a market figure is marked as sample data, say clearly that it is illustrative and must not be used for decisions.
5. If a district's foreign-ownership status is not verified, say the buyer must confirm it with REGA or a licensed broker.
6. Sources marked "summary, verify with source" should be presented as the current understanding with a reminder to confirm with the official source.
7. You give information, not legal, tax, financial or brokerage advice. Do not recommend whether to buy.
8. Format: the direct answer first (1-2 sentences), then short bullet points or a compact markdown table where useful, then one line naming the official sources. Keep it under 220 words unless the user asks for detail.
9. Reply in the language the user writes in (English, Arabic, Urdu, Hindi or Chinese). Keep numbers in Latin digits.`;

/** Answer composed directly from the retrieved passages, used when no AI key is configured. */
export function extractiveAnswer(g: Grounding): string {
  if (g.sources.length === 0) {
    return "I could not find this in the official library yet. Please check with the Real Estate General Authority (REGA) at rega.gov.sa, or rephrase your question with a city, district or topic (for example: taxes, foreign ownership, brokerage, leases).";
  }
  const lines: string[] = ["Here is what the official sources in the Miftah AI library say:", ""];
  // One bullet per document, with every passage from it and its citation numbers.
  const groups = new Map<string, ChatSource[]>();
  for (const s of g.sources) groups.set(s.title, [...(groups.get(s.title) ?? []), s]);
  for (const [title, items] of [...groups].slice(0, 5)) {
    const text = items.map((s) => `${s.kind === "data" ? s.excerpt.split("\n").slice(1).join(" ") : s.excerpt} [${s.n}]`).join(" ");
    lines.push(`- **${title}**: ${text}`);
  }
  if (g.sources.some((s) => s.status === "sample")) lines.push("", "Market figures above are illustrative sample data and must not be used for decisions.");
  lines.push("", "Information only, not legal or financial advice. Confirm with REGA or a licensed professional before acting.");
  return lines.join("\n");
}
