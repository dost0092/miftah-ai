import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getAppSession } from "@/lib/workspace/session";
import { addMessage, createThread, getThread, logActivity } from "@/lib/workspace/store";
import { SYSTEM_PROMPT, extractiveAnswer, ground } from "@/lib/workspace/advisor";
import { aiProvider, streamOpenRouter } from "@/lib/workspace/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Body = z.object({
  question: z.string().trim().min(2).max(2000),
  threadId: z.string().uuid().nullish(),
});

const MODEL = "claude-opus-5-5";

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
      const provider = aiProvider();
      send({ type: "meta", threadId, sources: g.sources, mode: provider ? "ai" : "library" });
      let answer = "";
      const userTurn = `Sources:\n\n${g.context || "(no matching official sources found)"}\n\n---\nQuestion: ${question}`;

      try {
        if (!provider) {
          answer = extractiveAnswer(g);
          send({ type: "delta", text: answer });
        } else if (provider === "openrouter") {
          await streamOpenRouter(
            [
              { role: "system", content: SYSTEM_PROMPT },
              ...history.map((m) => ({ role: m.role, content: m.content })),
              { role: "user", content: userTurn },
            ],
            (text) => {
              answer += text;
              send({ type: "delta", text });
            },
            { signal: req.signal },
          );
        } else {
          const client = new Anthropic();
          const messages: Anthropic.MessageParam[] = [
            ...history.map((m) => ({ role: m.role, content: m.content }) as Anthropic.MessageParam),
            { role: "user", content: userTurn },
          ];
          const s = client.messages.stream({
            model: MODEL,
            max_tokens: 4000,
            system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
            output_config: { effort: "low" },
            messages,
          });
          for await (const ev of s) {
            if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
              answer += ev.delta.text;
              send({ type: "delta", text: ev.delta.text });
            }
          }
          const final = await s.finalMessage();
          if (final.stop_reason === "refusal" && !answer) {
            answer = extractiveAnswer(g);
            send({ type: "delta", text: answer });
          }
        }
        send({ type: "done" });
      } catch (err) {
        console.error("advisor error", err instanceof Anthropic.APIError ? `${err.status} ${err.message}` : err);
        // Fall back to the sources themselves rather than leaving the user with nothing.
        if (!answer) {
          answer = extractiveAnswer(g);
          send({ type: "delta", text: answer });
          send({ type: "done" });
        } else send({ type: "error", message: "The answer was interrupted." });
      } finally {
        if (threadId && answer) await addMessage(session, threadId, "assistant", answer, g.sources).catch(() => {});
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}
