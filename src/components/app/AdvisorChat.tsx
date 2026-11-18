"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { LogoMark } from "@/components/Logo";
import { cn, fmtRelative } from "@/lib/format";
import type { ChatSource, ChatThread } from "@/lib/workspace/store";
import { Markdown } from "./Markdown";
import { StatusBadge } from "./ui";
import { IconBook, IconCheck, IconChevron, IconCopy, IconExternal, IconHistory, IconPlus, IconSend, IconTrash, IconX } from "@/components/Icons";

type Msg = { role: "user" | "assistant"; content: string; sources: ChatSource[]; pending?: boolean; error?: boolean };

function Sources({ id, sources, open, setOpen, highlight }: { id: string; sources: ChatSource[]; open: boolean; setOpen: (o: boolean) => void; highlight: number | null }) {
  const t = useTranslations("app.advisor");
  if (!sources.length) return null;
  return (
    <div className="mt-3">
      <button type="button" onClick={() => setOpen(!open)} className="inline-flex items-center gap-1.5 rounded-lg border border-sand-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-700 transition hover:border-sand-300">
        <IconBook width={14} height={14} className="text-green-600" />
        {t("sources")} <span className="text-ink-400" dir="ltr">({sources.length})</span>
        <IconChevron width={14} height={14} className={cn("transition", open && "rotate-180")} />
      </button>
      {open && (
        <ol className="mt-2 grid gap-2 sm:grid-cols-2">
          {sources.map((s) => {
            const external = s.url.startsWith("http");
            const body = (
              <>
                <span className="flex items-start gap-2">
                  <span className="cite !m-0 shrink-0">{s.n}</span>
                  <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-ink-900">{s.title}</span>
                  {external ? <IconExternal width={14} height={14} className="mt-0.5 shrink-0 text-ink-400" /> : null}
                </span>
                <span className="mt-1.5 line-clamp-2 block text-xs leading-relaxed text-ink-500">{s.excerpt}</span>
                <span className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={s.status} label={t(`status.${s.status}` as "status.verified")} />
                  <span className="truncate text-[11px] text-ink-400">{s.source}</span>
                </span>
              </>
            );
            const cls = cn("block rounded-xl border bg-white p-3 transition hover:border-green-300", highlight === s.n ? "border-green-500 ring-2 ring-green-100" : "border-sand-200");
            return (
              <li key={s.n} id={`${id}-src-${s.n}`}>
                {external ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className={cls}>{body}</a>
                ) : (
                  <Link href={s.url} className={cls}>{body}</Link>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function AssistantMessage({ m, idx }: { m: Msg; idx: number }) {
  const t = useTranslations("app.advisor");
  const [open, setOpen] = useState(false);
  const [hl, setHl] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const id = `m${idx}`;
  const cite = (n: number) => {
    setOpen(true);
    setHl(n);
    requestAnimationFrame(() => document.getElementById(`${id}-src-${n}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };
  return (
    <div className="flex gap-3 sm:gap-4">
      <LogoMark className="mt-0.5 h-8 w-8" />
      <div className="min-w-0 flex-1">
        {m.pending && !m.content ? (
          <p className="flex items-center gap-2 pt-1.5 text-sm text-ink-500">
            <span className="h-2 w-2 animate-pulse-soft rounded-full bg-green-600" /> {t("thinking")}
          </p>
        ) : (
          <Markdown text={m.content} onCite={cite} />
        )}
        {m.error && <p className="mt-2 text-sm text-red-600">{t("error")}</p>}
        {!m.pending && m.content && (
          <div className="flex flex-wrap items-start gap-2">
            <Sources id={id} sources={m.sources} open={open} setOpen={setOpen} highlight={hl} />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(m.content).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-ink-400 transition hover:bg-sand-100 hover:text-ink-700"
            >
              {copied ? <IconCheck width={14} height={14} /> : <IconCopy width={14} height={14} />} {copied ? t("copied") : t("copy")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdvisorChat({
  threads: initialThreads,
  threadId: initialThreadId,
  initialMessages,
  initialQuestion,
  aiMode,
}: {
  threads: ChatThread[];
  threadId: string | null;
  initialMessages: Msg[];
  initialQuestion: string | null;
  aiMode: boolean;
}) {
  const t = useTranslations("app.advisor");
  const locale = useLocale();
  const router = useRouter();
  const [threads, setThreads] = useState(initialThreads);
  const [threadId, setThreadId] = useState(initialThreadId);
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const started = useRef(false);
  const suggestions = t.raw("suggestions") as { title: string; q: string }[];

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (q.length < 2 || busy) return;
      setBusy(true);
      setInput("");
      setMessages((ms) => [...ms, { role: "user", content: q, sources: [] }, { role: "assistant", content: "", sources: [], pending: true }]);
      const patch = (fn: (m: Msg) => Msg) => setMessages((ms) => ms.map((m, i) => (i === ms.length - 1 ? fn(m) : m)));
      try {
        const res = await fetch("/api/app/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q, threadId }) });
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
              patch((m) => ({ ...m, sources: ev.sources }));
              if (ev.threadId && ev.threadId !== threadId) {
                setThreadId(ev.threadId);
                const now = new Date().toISOString();
                setThreads((ts) => [{ id: ev.threadId, title: q.slice(0, 120), created_at: now, updated_at: now }, ...ts.filter((x) => x.id !== ev.threadId)]);
                window.history.replaceState(null, "", `/${locale}/app/advisor?t=${ev.threadId}`);
              }
            } else if (ev.type === "delta") patch((m) => ({ ...m, content: m.content + ev.text }));
            else if (ev.type === "error") patch((m) => ({ ...m, error: true }));
          }
        }
        patch((m) => ({ ...m, pending: false }));
      } catch {
        patch((m) => ({ ...m, pending: false, error: true }));
      } finally {
        setBusy(false);
        textarea.current?.focus();
      }
    },
    [busy, threadId, locale],
  );

  // A question handed over from the dashboard or the search bar starts immediately.
  useEffect(() => {
    if (initialQuestion && !started.current) {
      started.current = true;
      send(initialQuestion);
    }
  }, [initialQuestion, send]);

  async function remove(id: string) {
    await fetch(`/api/app/threads/${id}`, { method: "DELETE" });
    setThreads((ts) => ts.filter((x) => x.id !== id));
    if (id === threadId) router.push("/app/advisor");
  }

  const history = (
    <aside className={cn("flex w-72 shrink-0 flex-col border-e border-sand-200 bg-sand-50/70", showHistory ? "fixed inset-y-0 start-0 z-50 shadow-frame lg:static lg:shadow-none" : "hidden lg:flex")}>
      <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-5">
        <p className="text-sm font-semibold text-ink-900">{t("history")}</p>
        <div className="flex items-center gap-1">
          <Link href="/app/advisor" onClick={() => setShowHistory(false)} className="grid h-8 w-8 place-items-center rounded-lg bg-night-950 text-white transition hover:bg-night-800" aria-label={t("new")} title={t("new")}>
            <IconPlus width={16} height={16} />
          </Link>
          <button type="button" onClick={() => setShowHistory(false)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-sand-200 lg:hidden" aria-label={t("hideHistory")}>
            <IconX width={16} height={16} />
          </button>
        </div>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {threads.length === 0 && <p className="px-3 py-2 text-sm text-ink-400">{t("noHistory")}</p>}
        {threads.map((th) => (
          <div key={th.id} className={cn("group relative flex items-center rounded-xl transition", th.id === threadId ? "bg-white shadow-[0_1px_2px_rgb(11_13_18/.06)] ring-1 ring-sand-200" : "hover:bg-white/70")}>
            <Link href={`/app/advisor?t=${th.id}`} onClick={() => setShowHistory(false)} className="flex min-w-0 flex-1 items-start gap-2.5 px-3 py-2.5">
              <IconHistory width={15} height={15} className="mt-0.5 shrink-0 text-ink-400" />
              <span className="min-w-0">
                <span className="block truncate text-sm text-ink-900">{th.title}</span>
                <span className="block text-[11px] text-ink-400">{fmtRelative(locale, th.updated_at)}</span>
              </span>
            </Link>
            <button type="button" onClick={() => remove(th.id)} className="me-1.5 hidden h-7 w-7 shrink-0 place-items-center rounded-lg text-ink-400 hover:bg-red-50 hover:text-red-600 group-hover:grid" aria-label={t("delete")} title={t("delete")}>
              <IconTrash width={14} height={14} />
            </button>
          </div>
        ))}
      </nav>
    </aside>
  );

  return (
    <div className="flex h-full min-h-0">
      {history}
      {showHistory && <button type="button" aria-label={t("hideHistory")} className="fixed inset-0 z-40 bg-night-950/30 lg:hidden" onClick={() => setShowHistory(false)} />}

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 px-4 pt-3 lg:hidden">
          <button type="button" onClick={() => setShowHistory(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-sand-200 px-2.5 py-1.5 text-xs font-medium text-ink-700">
            <IconHistory width={14} height={14} /> {t("history")}
          </button>
          <Link href="/app/advisor" className="inline-flex items-center gap-1.5 rounded-lg border border-sand-200 px-2.5 py-1.5 text-xs font-medium text-ink-700">
            <IconPlus width={14} height={14} /> {t("new")}
          </Link>
        </div>

        <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="app-canvas flex min-h-full flex-col items-center justify-center px-4 py-12 text-center">
              <LogoMark className="h-12 w-12" />
              <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">{t("emptyTitle")}</h1>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-500">{t("emptyBody")}</p>
              <div className="mt-8 grid w-full max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {suggestions.map((s) => (
                  <button key={s.q} type="button" onClick={() => send(s.q)} className="rounded-2xl border border-sand-200 bg-white p-4 text-start transition hover:-translate-y-0.5 hover:border-green-300 hover:shadow-[0_10px_24px_-14px_rgb(42_80_216/.5)]">
                    <span className="text-xs font-semibold text-green-600">{s.title}</span>
                    <span className="mt-1.5 block text-sm leading-snug text-ink-800">{s.q}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
              {messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="flex justify-end">
                    <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-ee-md bg-night-950 px-4 py-3 text-[15px] leading-relaxed text-white">{m.content}</p>
                  </div>
                ) : (
                  <AssistantMessage key={i} m={m} idx={i} />
                ),
              )}
            </div>
          )}
        </div>

        <div className="border-t border-sand-200 bg-white px-4 pb-4 pt-3 sm:px-6">
          <div className="mx-auto max-w-3xl">
            {!aiMode && <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-inset ring-amber-600/20">{t("libraryMode")}</p>}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-end gap-2 rounded-2xl border border-sand-200 bg-white p-2 ps-4 shadow-[0_8px_24px_-16px_rgb(11_13_18/.25)] transition focus-within:border-green-500 focus-within:shadow-[0_0_0_3px_rgb(42_80_216/.12)]"
            >
              <textarea
                ref={textarea}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                maxLength={2000}
                placeholder={t("placeholder")}
                aria-label={t("placeholder")}
                className="max-h-40 min-h-[2.5rem] flex-1 resize-none bg-transparent py-2 text-[15px] text-ink-900 outline-none placeholder:text-ink-400"
              />
              <button type="submit" disabled={busy || input.trim().length < 2} aria-label={t("send")} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-green-600 text-white transition hover:bg-green-700 disabled:bg-sand-200 disabled:text-ink-400">
                <IconSend width={18} height={18} />
              </button>
            </form>
            <p className="mt-2 text-center text-[11px] text-ink-400">{t("disclaimer")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
