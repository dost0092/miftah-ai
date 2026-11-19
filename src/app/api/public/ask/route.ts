import { z } from "zod";
import { ground } from "@/lib/workspace/advisor";
import { aiProvider } from "@/lib/workspace/llm";
import { streamAnswer } from "@/lib/workspace/answer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Free questions per visitor (by IP) per day in the light widget, before sign-up. */
const LIGHT_DAILY_LIMIT = 3;
const WINDOW_MS = 24 * 3600_000;

const Body = z.object({
  question: z.string().trim().min(2).max(600),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(3000) }))
    .max(6)
    .default([]),
});

// Per-instance memory. Good enough to stop casual overuse; a shared store (e.g. Supabase or
// Upstash) is needed for a hard limit across serverless instances.
const g = globalThis as unknown as { __lightUsage?: Map<string, number[]> };
const usage: Map<string, number[]> = (g.__lightUsage ??= new Map());

function clientIp(req: Request) {
  return (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "local").trim();
}

const LIGHT_RULES = `This is the light version of Miftah AI in a small website chat window, used by visitors without an account.
- Keep answers short: at most 120 words, a direct answer then up to 4 bullets.
- Still cite sources like [1] for every fact.
- When a question needs a full report, a district comparison or a personal cost breakdown, say that the free account can do this.`;

/**
 * Light advisor for website visitors. Same grounding and rules as the signed-in advisor,
 * shorter answers, nothing stored. Streams newline-delimited JSON like /api/app/chat.
 */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  const { question, history } = parsed.data;

  const ip = clientIp(req);
  const now = Date.now();
  const recent = (usage.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIGHT_DAILY_LIMIT) {
    return Response.json({ error: "limit", limit: LIGHT_DAILY_LIMIT }, { status: 429 });
  }
  recent.push(now);
  usage.set(ip, recent);
  const left = LIGHT_DAILY_LIMIT - recent.length;

  const previousUser = [...history].reverse().find((m) => m.role === "user")?.content ?? "";
  const gr = await ground(question, previousUser);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: unknown) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      send({ type: "meta", sources: gr.sources, mode: aiProvider() ? "ai" : "library", left });
      try {
        await streamAnswer({ question, history: history.slice(-4), g: gr, send, signal: req.signal, maxTokens: 700, extraInstructions: LIGHT_RULES });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}
