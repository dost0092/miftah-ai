import "server-only";
import { DATA_UNTIL, IS_SAMPLE_DATA, QUARTERS, trendChange, type District } from "@/lib/districts";
import { feeRules } from "@/lib/fees";
import { coreHits, findDistricts, getLibrary, searchKnowledge, type Hit } from "./library";
import type { ChatSource } from "./store";

/**
 * Retrieval step of the advisor (RAG): gathers the official passages and market figures a
 * question needs and numbers them [1], [2] … so the answer can cite each claim.
 */

export type Grounding = { sources: ChatSource[]; context: string; districts: District[]; hits: Hit[]; summaries: Record<number, string>; fallback: boolean };

const FEE_WORDS = /\b(fee|fees|cost|costs|tax|taxes|rett|vat|commission|budget|total|afford|price|prices|how much|closing)\b|رسوم|ضريبة|عمولة|تكلفة|سعر/i;
const FEE_LABEL: Record<string, string> = {
  rett: "Real Estate Transaction Tax (RETT)",
  brokerage: "Brokerage commission (default, negotiable in writing)",
  brokerageVat: "VAT on the brokerage commission",
  disposal: "REGA fee on a non-Saudi's disposal (sale) of property in Riyadh, Jeddah, Makkah or Madinah (Executive Regulations, June 2026)",
};

function pct(n: number) {
  return `${+(n * 100).toFixed(2)}%`;
}

export async function ground(question: string, previous = ""): Promise<Grounding> {
  let { hits } = await searchKnowledge(`${question} ${previous}`.slice(0, 600), 6);
  const dists = findDistricts(question).length ? findDistricts(question) : findDistricts(previous);
  // Nothing matched: answer from the core ownership rules instead of giving up.
  const fallback = hits.length === 0 && dists.length === 0;
  if (fallback) hits = await coreHits();
  const { docs } = await getLibrary();
  const summaryOf = new Map(docs.map((d) => [d.id, d.summary]));
  const summaries: Record<number, string> = {};
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
    if (c === 0) summaries[n] = summaryOf.get(h.docId) ?? "";
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

  const context = blocks.join("\n\n") + (fallback ? "\n\n(Note: the question did not match a specific rule; these are the core ownership rules. Answer what you can from them and ask one short follow-up question about the city, budget or the buyer's situation.)" : "");
  return { sources, context, districts: dists, hits, summaries, fallback };
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

export type Lang = "en" | "ar" | "ur" | "hi" | "zh";

/** Language of a message from its script; Latin text falls back to the page language. */
export function detectLang(text: string, fallback: string = "en"): Lang {
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u4E00-\u9FFF]/.test(text)) return "zh";
  if (/[\u0600-\u06FF]/.test(text)) return /[ٹڈڑںےیہگچپکژ]/.test(text) ? "ur" : "ar";
  return (["en", "ar", "ur", "hi", "zh"] as const).includes(fallback as Lang) ? (fallback as Lang) : "en";
}

const GREETING = /^\s*(hi+|hello+|hey+|hiya|salam|salaam|slam|assalam\w*|aoa|asalam\w*|marhaba|namaste|namaskar|good (morning|afternoon|evening)|thanks?( you)?|thank u|thx|ok(ay)?|test|السلام عليكم|السلام علیکم|سلام|مرحبا|اهلا|أهلا|شكرا|شکریہ|नमस्ते|नमस्कार|धन्यवाद|शुक्रिया|你好|您好|谢谢)[\s!.,؟?،]*$/i;

export function isSmalltalk(text: string) {
  return GREETING.test(text);
}

const HELLO: Record<Lang, string> = {
  en: "Salam! I'm Miftah AI. I can help you understand buying property in Saudi Arabia as a foreigner. You can ask me, for example:\n\n- Can I buy a flat in Riyadh or Jeddah?\n- What fees will I pay on a SAR 1 million flat?\n- How do I apply as a resident or from abroad?\n- Does buying a home give me residency?\n\nTell me your city and situation (living in Saudi or abroad) and I'll answer from the official sources.",
  ar: "السلام عليكم! أنا مفتاح AI. أساعدك على فهم شراء العقار في السعودية لغير السعوديين. يمكنك أن تسألني مثلاً:\n\n- هل يمكنني شراء شقة في الرياض أو جدة؟\n- ما الرسوم على شقة بمليون ريال؟\n- كيف أقدّم وأنا مقيم أو من خارج المملكة؟\n- هل يمنحني شراء المسكن الإقامة؟\n\nأخبرني بمدينتك ووضعك (مقيم في السعودية أو خارجها) وسأجيبك من المصادر الرسمية.",
  ur: "السلام علیکم! میں مفتاح AI ہوں۔ میں غیر ملکی کے طور پر سعودی عرب میں جائیداد خریدنے کو سمجھنے میں آپ کی مدد کرتا ہوں۔ آپ مثلاً یہ پوچھ سکتے ہیں:\n\n- کیا میں ریاض یا جدہ میں فلیٹ خرید سکتا ہوں؟\n- 10 لاکھ ریال کے فلیٹ پر کتنی فیس لگے گی؟\n- سعودی عرب میں رہتے ہوئے یا باہر سے درخواست کیسے دوں؟\n- کیا گھر خریدنے سے اقامہ ملتا ہے؟\n\nاپنا شہر اور صورتحال (سعودی عرب میں یا باہر) بتائیں، میں سرکاری ذرائع سے جواب دوں گا۔",
  hi: "नमस्ते! मैं Miftah AI हूँ। मैं विदेशी के रूप में सऊदी अरब में संपत्ति खरीदने को समझने में आपकी मदद करता हूँ। आप उदाहरण के लिए पूछ सकते हैं:\n\n- क्या मैं रियाद या जेद्दा में फ़्लैट खरीद सकता हूँ?\n- 10 लाख रियाल के फ़्लैट पर कितना शुल्क लगेगा?\n- सऊदी में रहते हुए या विदेश से आवेदन कैसे करूँ?\n- क्या घर खरीदने से रेज़िडेंसी मिलती है?\n\nअपना शहर और स्थिति (सऊदी में या विदेश में) बताइए, मैं आधिकारिक स्रोतों से जवाब दूँगा।",
  zh: "您好！我是 Miftah AI，帮助外国人了解在沙特购房。您可以这样问我：\n\n- 我可以在利雅得或吉达买公寓吗？\n- 100 万里亚尔的公寓要付哪些费用？\n- 住在沙特或在国外，如何申请？\n- 买房能获得居留权吗？\n\n告诉我您所在的城市和情况（在沙特还是国外），我会依据官方来源回答。",
};

export const EMPTY_GROUNDING: Grounding = { sources: [], context: "", districts: [], hits: [], summaries: {}, fallback: false };

export function smalltalkReply(lang: Lang) {
  return HELLO[lang];
}

/** Answer composed directly from the retrieved passages, used when no AI key is configured. */
/** Answer composed directly from the retrieved passages, used when no AI key is configured. */
export function extractiveAnswer(g: Grounding): string {
  if (g.sources.length === 0) {
    return "I don't have an official rule on that yet. Please check with the Real Estate General Authority (REGA) at rega.gov.sa, or ask me about where foreigners can buy, fees, how to apply, title deeds, renting or residency.";
  }
  const rules = g.sources.filter((s) => s.kind === "rule");
  const data = g.sources.filter((s) => s.kind === "data");
  const seen = new Set<string>();
  const firstPerDoc = rules.filter((s) => (seen.has(s.title) ? false : (seen.add(s.title), true)));
  const lines: string[] = [];
  if (g.fallback) lines.push("Here is the short version of the rules most buyers ask about first:", "");
  const [lead, ...rest] = firstPerDoc;
  if (lead) lines.push(`${g.summaries[lead.n] || lead.excerpt} [${lead.n}]`, "");
  if (rest.length) {
    lines.push("**Also relevant:**");
    for (const r of rest.slice(0, 3)) lines.push(`- ${g.summaries[r.n] || r.excerpt} [${r.n}]`);
    lines.push("");
  }
  for (const d of data) {
    const body = d.excerpt.split("\n").slice(1).join(" ");
    lines.push(`- **${d.title}**: ${body} [${d.n}]`);
  }
  if (data.length) lines.push("");
  if (g.sources.some((s) => s.status === "sample")) lines.push("Market figures are sample data, not real prices.", "");
  lines.push("Check the exact property on REGA's official zone map (saudiproperties.rega.gov.sa/zones). Information only, not legal advice.");
  return lines.join("\n");
}
