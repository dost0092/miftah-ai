import "server-only";

/**
 * OpenRouter client for the advisor. Takes one or more API keys and moves to the next key
 * (and then to a fallback model) when one is rate-limited, out of credit or failing, so a
 * daily free-tier limit on one key does not stop answers.
 *
 * Keys: OPENROUTER_API_KEY, OPENROUTER_API_KEY_2, … or a comma-separated OPENROUTER_API_KEYS.
 */

export type ChatTurn = { role: "system" | "user" | "assistant"; content: string };

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemma-4-31b-it:free";
const DEFAULT_FALLBACK = "google/gemma-4-26b-a4b-it:free";

export function openRouterKeys(): string[] {
  const list = [
    ...(process.env.OPENROUTER_API_KEYS ?? "").split(","),
    process.env.OPENROUTER_API_KEY,
    process.env.OPENROUTER_API_KEY_2,
    process.env.OPENROUTER_API_KEY_3,
  ]
    .map((k) => (k ?? "").trim())
    .filter(Boolean);
  return [...new Set(list)];
}

export function openRouterModels(): string[] {
  const primary = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;
  const fallback = process.env.OPENROUTER_FALLBACK_MODEL?.trim() || DEFAULT_FALLBACK;
  return [...new Set([primary, fallback].filter(Boolean))];
}

/** Which AI provider answers: Anthropic if its key is set, else OpenRouter, else none (library mode). */
export function aiProvider(): "anthropic" | "openrouter" | null {
  if (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) return "anthropic";
  if (openRouterKeys().length) return "openrouter";
  return null;
}

// Per-instance memory: which key to start with and which keys are resting after an error.
const g = globalThis as unknown as { __orState?: { next: number; coolUntil: Map<string, number> } };
const state = (g.__orState ??= { next: 0, coolUntil: new Map() });

class RetryableError extends Error {}

function cooldownMs(res: Response): number {
  if (res.status === 429) {
    const reset = Number(res.headers.get("x-ratelimit-reset"));
    // The header is a Unix time in ms; if the daily cap is hit it points at 00:00 UTC.
    if (Number.isFinite(reset) && reset > Date.now()) return Math.min(reset - Date.now(), 24 * 3600_000);
    return 60_000;
  }
  if (res.status === 401 || res.status === 402 || res.status === 403) return 3600_000;
  return 15_000; // 5xx / provider hiccup
}

const mask = (k: string) => `…${k.slice(-4)}`;

/**
 * Streams an answer, calling onDelta for each text chunk. Tries every key on the primary model,
 * then every key on the fallback model, but only while nothing has been streamed yet.
 */
export async function streamOpenRouter(messages: ChatTurn[], onDelta: (text: string) => void, opts: { maxTokens?: number; signal?: AbortSignal } = {}): Promise<void> {
  const keys = openRouterKeys();
  if (!keys.length) throw new Error("No OpenRouter key configured");
  const start = state.next++ % keys.length;
  const ordered = keys.map((_, i) => keys[(start + i) % keys.length]);
  let lastErr: unknown = null;

  for (const model of openRouterModels()) {
    // Prefer keys that are not resting; if all are, still try them once (the limit may have reset).
    const now = Date.now();
    const ready = ordered.filter((k) => (state.coolUntil.get(k) ?? 0) <= now);
    const tryKeys = ready.length ? ready : ordered;

    for (const key of tryKeys) {
      let streamed = false;
      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          signal: opts.signal,
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://miftahai.co",
            "X-Title": "Miftah AI",
          },
          body: JSON.stringify({ model, messages, stream: true, max_tokens: opts.maxTokens ?? 1500, temperature: 0.2 }),
        });

        if (!res.ok || !res.body) {
          const body = await res.text().catch(() => "");
          state.coolUntil.set(key, Date.now() + cooldownMs(res));
          console.warn(`openrouter ${res.status} on key ${mask(key)} model ${model}: ${body.slice(0, 200)}`);
          lastErr = new Error(`OpenRouter ${res.status}`);
          continue;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let finished = false;
        while (!finished) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line.startsWith("data:")) continue; // ": OPENROUTER PROCESSING" keep-alives
            const data = line.slice(5).trim();
            if (data === "[DONE]") { finished = true; break; }
            let ev: { error?: { message?: string; code?: number }; choices?: { delta?: { content?: string | null } }[] };
            try { ev = JSON.parse(data); } catch { continue; }
            if (ev.error) throw new RetryableError(`stream error ${ev.error.code ?? ""} ${ev.error.message ?? ""}`);
            const text = ev.choices?.[0]?.delta?.content;
            if (text) { streamed = true; onDelta(text); }
          }
        }
        if (!streamed) throw new RetryableError("empty response");
        return;
      } catch (err) {
        if (streamed) throw err; // part of the answer already reached the user; let the caller handle it
        if (opts.signal?.aborted) throw err;
        state.coolUntil.set(key, Date.now() + 15_000);
        console.warn(`openrouter failed on key ${mask(key)} model ${model}:`, err instanceof Error ? err.message : err);
        lastErr = err;
      }
    }
  }
  throw lastErr ?? new Error("OpenRouter unavailable");
}
