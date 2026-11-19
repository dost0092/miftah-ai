"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link } from "@/i18n/navigation";
import { Markdown } from "@/components/app/Markdown";
import { useUser } from "@/lib/hooks/use-user";
import { cn } from "@/lib/format";
import { LogoMark } from "./Logo";
import { IconCollapse, IconExpand, IconExternal, IconPlus, IconSend, IconX } from "./Icons";

type Source = { n: number; title: string; url: string; status: string; source: string; kind: "rule" | "data" };
type Msg = { role: "user" | "assistant"; content: string; sources: Source[]; pending?: boolean; error?: boolean; limit?: "visitor" | "plan" };

const statusStyle: Record<string, string> = {
  verified: "bg-green-50 text-green-800 ring-green-600/25",
  needs_review: "bg-gold-100 text-gold-700 ring-gold-500/30",
  guidance: "bg-white text-ink-700 ring-ink-400/30",
  sample: "bg-sand-100 text-ink-700 ring-ink-400/30",
};

/**
 * Miftah AI, light version: a chat window in the bottom corner of every public page.
 * Visitors get a few free answers a day from /api/public/ask (nothing stored);
 * signed-in users chat through their account (/api/app/chat), so history and plan limits apply.
 * Other components open it with openMiftah(question).
 */
export function MiftahWidget() {
  const t = useTranslations("widget");
  const ts = useTranslations("app.advisor.status");
  const locale = useLocale();
  const user = useUser();
  const [open, setOpen] = useState(false);
  const [big, setBig] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState<number | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [nudge, setNudge] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const abort = useRef<AbortController | null>(null);
  const suggestions = t.raw("suggestions") as string[];
  const signedIn = Boolean(user);
  const fullHref = signedIn ? "/app/advisor" : { pathname: "/signup", query: { next: `/${locale}/app/advisor` } };

  // A small greeting bubble after a few seconds, once per browser session.
  useEffect(() => {
    try {
      if (sessionStorage.getItem("miftah-nudged")) return;
    } catch {}
    const id = setTimeout(() => {
      setNudge(true);
      try {
        sessionStorage.setItem("miftah-nudged", "1");
      } catch {}
    }, 6000);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (open) {
      setNudge(false);
      setTimeout(() => field.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages]);

  const ask = useCallback(
    async (raw: string) => {
      const q = raw.trim();
      if (q.length < 2 || busy) return;
      setInput("");
      setBusy(true);
      const history = messages.filter((m) => !m.pending && !m.error && !m.limit && m.content).slice(-6).map((m) => ({ role: m.role, content: m.content }));
      setMessages((ms) => [...ms, { role: "user", content: q, sources: [] }, { role: "assistant", content: "", sources: [], pending: true }]);
      const patch = (fn: (m: Msg) => Msg) => setMessages((ms) => ms.map((m, i) => (i === ms.length - 1 ? fn(m) : m)));
      const ctrl = new AbortController();
      abort.current = ctrl;
      try {
        const res = signedIn
          ? await fetch("/api/app/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q, threadId, locale }), signal: ctrl.signal })
          : await fetch("/api/public/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q, history, locale }), signal: ctrl.signal });
        if (res.status === 429 || res.status === 402) {
          setLeft(0);
          patch((m) => ({ ...m, pending: false, limit: res.status === 402 ? "plan" : "visitor" }));
          return;
        }
        if (!res.ok || !res.body) throw new Error(String(res.status));
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            const ev = JSON.parse(line);
            if (ev.type === "meta") {
              patch((m) => ({ ...m, sources: ev.sources ?? [] }));
              if (typeof ev.left === "number") setLeft(ev.left);
              if (ev.threadId) setThreadId(ev.threadId);
            } else if (ev.type === "delta") patch((m) => ({ ...m, content: m.content + ev.text }));
            else if (ev.type === "error") patch((m) => ({ ...m, error: true }));
          }
        }
        patch((m) => ({ ...m, pending: false }));
      } catch {
        patch((m) => (ctrl.signal.aborted ? { ...m, pending: false } : { ...m, pending: false, error: true }));
      } finally {
        abort.current = null;
        setBusy(false);
      }
    },
    [busy, messages, signedIn, threadId, locale],
  );

  // openMiftah(question) from anywhere on the page.
  useEffect(() => {
    const onAsk = (e: Event) => {
      const q = (e as CustomEvent<{ question?: string }>).detail?.question;
      setOpen(true);
      if (q) ask(q);
    };
    window.addEventListener("miftah:ask", onAsk);
    return () => window.removeEventListener("miftah:ask", onAsk);
  }, [ask]);

  // Shareable links: ?ask=1 opens the window, ?ask=<question> also asks it (used in outreach).
  const askedFromUrl = useRef(false);
  useEffect(() => {
    if (askedFromUrl.current || user === undefined) return;
    const q = new URLSearchParams(window.location.search).get("ask");
    if (q === null) return;
    askedFromUrl.current = true;
    setOpen(true);
    if (q.trim().length > 1) ask(q.slice(0, 600));
  }, [ask, user]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    ask(input);
  }
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask(input);
    }
  }
  function newChat() {
    abort.current?.abort();
    setMessages([]);
    setThreadId(null);
  }

  return (
    <div className="no-print">
      {/* Launcher */}
      {!open && (
        <div className="fixed bottom-4 end-4 z-50 flex flex-col items-end gap-2 sm:bottom-6 sm:end-6">
          {nudge && (
            <div className="relative max-w-[260px] rounded-xl border border-sand-200 bg-white p-3 pe-8 text-sm leading-snug text-ink-700 shadow-frame msg-in">
              {t("nudge")}
              <button type="button" onClick={() => setNudge(false)} aria-label={t("close")} className="absolute end-1.5 top-1.5 grid h-6 w-6 place-items-center rounded text-ink-400 hover:bg-sand-100">
                <IconX width={13} height={13} />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="press inline-flex items-center gap-2.5 rounded-full bg-green-600 py-2 pe-5 ps-2 text-sm font-semibold text-white shadow-frame transition hover:bg-green-700"
            aria-label={t("launcher")}
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white">
              <LogoMark className="h-7 w-7" />
            </span>
            {t("launcher")}
          </button>
        </div>
      )}

      {/* Panel */}
      {open && (
        <section
          role="dialog"
          aria-label={t("title")}
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden bg-white shadow-frame msg-in",
            "inset-0 sm:inset-auto sm:bottom-6 sm:end-6 sm:rounded-2xl sm:border sm:border-sand-200",
            big ? "sm:h-[min(820px,calc(100vh-3rem))] sm:w-[min(720px,calc(100vw-3rem))]" : "sm:h-[min(620px,calc(100vh-3rem))] sm:w-[400px]",
          )}
        >
          {/* header */}
          <header className="flex items-center gap-3 border-b border-sand-200 bg-sand-50 px-4 py-3">
            <LogoMark className="h-9 w-9" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-semibold text-ink-900">
                {t("title")}
                <span className="rounded bg-gold-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-700">{t("light")}</span>
              </p>
              <p className="truncate text-xs text-ink-500">{t("subtitle")}</p>
            </div>
            {messages.length > 0 && (
              <button type="button" onClick={newChat} title={t("newChat")} aria-label={t("newChat")} className="press grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-sand-100 hover:text-ink-900">
                <IconPlus width={17} height={17} />
              </button>
            )}
            <button type="button" onClick={() => setBig((b) => !b)} title={big ? t("shrink") : t("expand")} aria-label={big ? t("shrink") : t("expand")} className="press hidden h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-sand-100 hover:text-ink-900 sm:grid">
              {big ? <IconCollapse width={16} height={16} /> : <IconExpand width={16} height={16} />}
            </button>
            <button type="button" onClick={() => setOpen(false)} title={t("close")} aria-label={t("close")} className="press grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-sand-100 hover:text-ink-900">
              <IconX width={17} height={17} />
            </button>
          </header>

          {/* messages */}
          <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            <div className="flex gap-2.5">
              <LogoMark className="h-7 w-7" />
              <div className="rounded-2xl rounded-ss-md bg-sand-100 px-3.5 py-2.5 text-sm leading-relaxed text-ink-800">{t("welcome")}</div>
            </div>
            {messages.length === 0 && (
              <div className="flex flex-col items-start gap-2 ps-9">
                {suggestions.map((s) => (
                  <button key={s} type="button" onClick={() => ask(s)} className="rounded-full border border-green-600/25 bg-white px-3 py-1.5 text-start text-xs font-medium text-green-800 transition hover:bg-green-50">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-se-md bg-green-600 px-3.5 py-2.5 text-sm leading-relaxed text-white">{m.content}</p>
                </div>
              ) : (
                <div key={i} className="flex gap-2.5">
                  <LogoMark className="h-7 w-7" />
                  <div className="min-w-0 flex-1">
                    {m.limit ? (
                      <div className="rounded-xl border border-green-600/25 bg-green-50 p-4 text-sm">
                        <p className="font-semibold text-ink-900">{m.limit === "plan" ? t("planLimitTitle") : t("limitTitle")}</p>
                        <p className="mt-1 leading-relaxed text-ink-600">{m.limit === "plan" ? t("planLimitBody") : t("limitBody")}</p>
                        <Link href={m.limit === "plan" ? "/app/billing" : { pathname: "/signup", query: { next: `/${locale}/app/advisor` } }} className="btn btn-primary mt-3 !py-2 text-sm">
                          {m.limit === "plan" ? t("planLimitCta") : t("limitCta")}
                        </Link>
                      </div>
                    ) : m.pending && !m.content ? (
                      <div className="inline-flex items-center gap-2 rounded-2xl rounded-ss-md bg-sand-100 px-3.5 py-2.5 text-sm text-ink-500">
                        <span className="flex gap-1">
                          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-green-600" />
                          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-green-600 [animation-delay:.2s]" />
                          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-green-600 [animation-delay:.4s]" />
                        </span>
                        {t("thinking")}
                      </div>
                    ) : (
                      <div className={cn("rounded-2xl rounded-ss-md bg-sand-100 px-3.5 py-2.5 text-sm leading-relaxed text-ink-800", m.pending && "streaming")}>
                        <div className="prose-chat">
                          <Markdown text={m.content} />
                        </div>
                        {m.error && <p className="mt-2 text-xs text-ink-500">{t("error")}</p>}
                      </div>
                    )}
                    {!m.pending && m.sources.length > 0 && (
                      <details className="mt-1.5 text-xs">
                        <summary className="cursor-pointer select-none text-ink-500 hover:text-green-700">{t("sources", { n: m.sources.length })}</summary>
                        <ol className="mt-1.5 space-y-1.5">
                          {m.sources.map((s) => (
                            <li key={s.n} className="flex items-start gap-2">
                              <span className="cite shrink-0">{s.n}</span>
                              <span className="min-w-0 flex-1">
                                {s.url.startsWith("http") ? (
                                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium text-ink-800 hover:text-green-700 hover:underline">{s.title}</a>
                                ) : (
                                  <span className="font-medium text-ink-800">{s.title}</span>
                                )}
                                <span className={cn("ms-1.5 inline-flex rounded px-1.5 py-px text-[10px] font-semibold ring-1 ring-inset", statusStyle[s.status] ?? statusStyle.sample)}>
                                  {ts.has(s.status) ? ts(s.status as "verified") : s.status}
                                </span>
                              </span>
                            </li>
                          ))}
                        </ol>
                      </details>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>

          {/* composer */}
          <form onSubmit={onSubmit} className="border-t border-sand-200 bg-white p-3">
            <div className="flex items-end gap-2 rounded-xl border border-sand-300 bg-white p-1.5 transition focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-600/15">
              <textarea
                ref={field}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                maxLength={600}
                placeholder={t("placeholder")}
                aria-label={t("placeholder")}
                className="max-h-28 min-h-[38px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-400"
              />
              <button type="submit" disabled={busy || input.trim().length < 2} aria-label={t("send")} className="press grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-green-600 text-white transition hover:bg-green-700 disabled:opacity-40">
                <IconSend width={16} height={16} className="flip-rtl" />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-ink-400">
              <span className="truncate">
                {signedIn ? t("savedNote") : left !== null ? t("left", { n: left }) : t("disclaimer")}
              </span>
              <Link href={fullHref} className="inline-flex shrink-0 items-center gap-1 font-semibold text-green-700 hover:underline">
                {t("openFull")} <IconExternal width={11} height={11} />
              </Link>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
