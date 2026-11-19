import { z } from "zod";
import { getAppSession } from "@/lib/workspace/session";
import { addMessage, createThread, getThread, logActivity } from "@/lib/workspace/store";
import { ground } from "@/lib/workspace/advisor";
import { aiProvider } from "@/lib/workspace/llm";
import { streamAnswer } from "@/lib/workspace/answer";
import { canUse, getAllowance, recordUsage } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Body = z.object({
  question: z.string().trim().min(2).max(2000),
  threadId: z.string().uuid().nullish(),
});

/**
 * AI advisor endpoint. Streams newline-delimited JSON events:
 *   {type:"meta", threadId, sources, mode}  then  {type:"delta", text}…  then  {type:"done"} | {type:"error", message}
 */
export async function POST(req: Request) {
  const session = await getAppSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  const { question } = parsed.data;

  // Free plan: monthly question allowance. Pro is unlimited.
  const allowance = await getAllowance(session);
  if (!canUse(allowance, "chat")) {
    return Response.json({ error: "limit", used: allowance.used.chat, limit: allowance.limits?.chat ?? 0 }, { status: 402 });
  }
  await recordUsage(session, "chat");

  // Thread: continue an existing conversation or start a new one titled by the question.
  let threadId = parsed.data.threadId ?? null;
  const existing = threadId ? await getThread(session, threadId) : null;
  if (!existing) threadId = await createThread(session, question);
  const history = existing?.messages.slice(-8) ?? [];
  const previousUser = [...history].reverse().find((m) => m.role === "user")?.content ?? "";

  const g = await ground(question, previousUser);
  if (threadId) await addMessage(session, threadId, "user", question);
  await logActivity(session, { kind: "chat", title: question, href: threadId ? `/app/advisor?t=${threadId}` : "/app/advisor" });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: unknown) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      send({ type: "meta", threadId, sources: g.sources, mode: aiProvider() ? "ai" : "library" });
      let answer = "";
      try {
        answer = await streamAnswer({
          question,
          history: history.map((m) => ({ role: m.role, content: m.content })),
          g,
          send,
          signal: req.signal,
        });
      } finally {
        if (threadId && answer) await addMessage(session, threadId, "assistant", answer, g.sources).catch(() => {});
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}
