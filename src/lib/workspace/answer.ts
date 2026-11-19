import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, extractiveAnswer, type Grounding } from "./advisor";
import { aiProvider, streamOpenRouter } from "./llm";

const MODEL = "claude-opus-5-5";

export type Turn = { role: "user" | "assistant"; content: string };
export type AdvisorEvent = { type: "meta"; [k: string]: unknown } | { type: "delta"; text: string } | { type: "done" } | { type: "error"; message: string };

/**
 * Writes the grounded answer for one question and streams it through `send`.
 * Uses Claude when ANTHROPIC_API_KEY is set, otherwise OpenRouter, otherwise quotes the
 * official library directly. Always falls back to the library text instead of failing empty.
 * Returns the full answer text.
 */
export async function streamAnswer(opts: {
  question: string;
  history: Turn[];
  g: Grounding;
  send: (e: AdvisorEvent) => void;
  signal?: AbortSignal;
  maxTokens?: number;
  extraInstructions?: string;
}): Promise<string> {
  const { question, history, g, send, signal, maxTokens, extraInstructions } = opts;
  const provider = aiProvider();
  const system = extraInstructions ? `${SYSTEM_PROMPT}\n\n${extraInstructions}` : SYSTEM_PROMPT;
  const userTurn = `Sources:\n\n${g.context || "(no matching official sources found)"}\n\n---\nQuestion: ${question}`;
  let answer = "";
  const emit = (text: string) => {
    answer += text;
    send({ type: "delta", text });
  };

  try {
    if (!provider) {
      emit(extractiveAnswer(g));
    } else if (provider === "openrouter") {
      await streamOpenRouter([{ role: "system", content: system }, ...history, { role: "user", content: userTurn }], emit, { signal, maxTokens });
    } else {
      const client = new Anthropic();
      const s = client.messages.stream({
        model: MODEL,
        max_tokens: maxTokens ?? 4000,
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        output_config: { effort: "low" },
        messages: [...history, { role: "user", content: userTurn }],
      });
      for await (const ev of s) {
        if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") emit(ev.delta.text);
      }
      const final = await s.finalMessage();
      if (final.stop_reason === "refusal" && !answer) emit(extractiveAnswer(g));
    }
    send({ type: "done" });
  } catch (err) {
    console.error("advisor error", err instanceof Anthropic.APIError ? `${err.status} ${err.message}` : err);
    // Fall back to the sources themselves rather than leaving the user with nothing.
    if (!answer) {
      emit(extractiveAnswer(g));
      send({ type: "done" });
    } else send({ type: "error", message: "The answer was interrupted." });
  }
  return answer;
}
