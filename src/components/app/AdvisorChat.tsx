"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { LogoMark } from "@/components/Logo";
import { cn } from "@/lib/format";
import type { ChatSource, ChatThread } from "@/lib/workspace/store";
import { Markdown } from "./Markdown";
import { StatusBadge } from "./ui";
import { UpgradeNotice } from "./billing";
import {
  IconBook,
  IconCalc,
  IconCheck,
  IconCoins,
  IconCopy,
  IconDoc,
  IconExternal,
  IconHistory,
  IconKey,
  IconMap,
  IconPlus,
  IconRefresh,
  IconSend,
  IconShield,
  IconStop,
  IconTrash,
  IconTrend,
  IconX,
} from "@/components/Icons";

type Msg = { role: "user" | "assistant"; content: string; sources: ChatSource[]; pending?: boolean; error?: boolean; limit?: number; phase?: "search" | "read" | "write" };

const suggestionIcons = [IconShield, IconCoins, IconTrend, IconKey, IconDoc, IconMap];

/** Hostname-ish label for a source, e.g. "rega.gov.sa" or "Miftah AI". */
function sourceHost(s: ChatSource) {
  if (!s.url.startsWith("http")) return "Miftah AI";
  try {
    return new URL(s.url).hostname.replace(/^www\./, "");
  } catch {
    return s.source;
  }
}

/** Compact source cards shown above an answer, Perplexity-style. */
function SourceStrip({ id, sources, highlight }: { id: string; sources: ChatSource[]; highlight: number | null }) {
  const t = useTranslations("app.advisor");
  const [expanded, setExpanded] = useState(false);
  if (!sources.length) return null;
  const shown = expanded ? sources : sources.slice(0, 4);
  return (
    <div className="mb-4">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-500">
        <IconBook width={14} height={14} className="text-green-600" />
        {t("sources")}
        <span className="text-ink-400" dir="ltr">· {sources.length}</span>
      </p>
      <ol className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {shown.map((s) => {
          const external = s.url.startsWith("http");
          const body = (
            <>
              <span className="line-clamp-2 text-[12.5px] font-medium leading-snug text-ink-900">{s.title}</span>
              <span className="mt-auto flex items-center gap-1.5 pt-2 text-[11px] text-ink-400">
                <span className="grid h-4 min-w-4 place-items-center rounded bg-night-950 px-1 text-[9.5px] font-semibold text-white" dir="ltr">{s.n}</span>
                <span className="truncate" dir="ltr">{sourceHost(s)}</span>
                {external && <IconExternal width={11} height={11} className="ms-auto shrink-0" />}
              </span>
            </>
          );
          const cls = cn(
            "flex h-full min-h-[84px] flex-col rounded-xl border bg-white p-3 text-start transition hover:-translate-y-px hover:border-sand-300 hover:shadow-[0_6px_16px_-10px_rgb(11_13_18/.35)]",
            highlight === s.n ? "border-green-500 ring-2 ring-green-100" : "border-sand-200",
          );
          return (
            <li key={s.n} id={`${id}-src-${s.n}`} className="min-w-0">
              {external ? (
                <a href={s.url} target="_blank" rel="noopener noreferrer" className={cls} title={s.excerpt}>{body}</a>
              ) : (
                <Link href={s.url} className={cls} title={s.excerpt}>{body}</Link>
              )}
            </li>
          );
        })}
        {!expanded && sources.length > 4 && (
          <li>
            <button type="button" onClick={() => setExpanded(true)} className="flex h-full min-h-[84px] w-full flex-col items-start justify-between rounded-xl border border-dashed border-sand-300 bg-sand-50 p-3 text-start text-[12.5px] font-medium text-ink-700 transition hover:bg-white">
              <span className="flex -space-x-1 rtl:space-x-reverse">
                {sources.slice(4, 7).map((s) => (
                  <span key={s.n} className="grid h-5 w-5 place-items-center rounded-full bg-white text-[10px] font-semibold text-ink-700 ring-1 ring-sand-300" dir="ltr">{s.n}</span>
                ))}
              </span>
              <span dir="ltr">+{sources.length - 4}</span>
            </button>
          </li>
        )}
      </ol>
      {expanded && (
        <ul className="mt-2 space-y-1.5">
          {sources.map((s) => (
            <li key={s.n} className="flex items-start gap-2 text-xs text-ink-500">
              <span className="cite !m-0 shrink-0">{s.n}</span>
              <span className="min-w-0 flex-1">
                <span className="text-ink-700">{s.source}</span>
                <span className="mx-1.5 text-ink-300">·</span>
                <span className="line-clamp-1 inline">{s.excerpt}</span>
              </span>
              <StatusBadge status={s.status} label={t(`status.${s.status}` as "status.verified")} className="shrink-0" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Animated progress while the answer is being prepared. */
function Progress({ phase, count }: { phase: Msg["phase"]; count: number }) {
  const t = useTranslations("app.advisor");
  const steps: { key: "search" | "read" | "write"; label: string }[] = [
    { key: "search", label: t("steps.search") },
    { key: "read", label: count ? t("steps.read", { n: count }) : t("steps.readAny") },
    { key: "write", label: t("steps.write") },
  ];
  const at = steps.findIndex((s) => s.key === (phase ?? "search"));
  return (
    <ol className="space-y-2 pt-1">
      {steps.map((s, i) => (
        <li key={s.key} className={cn("flex items-center gap-2.5 text-sm transition", i > at ? "text-ink-300" : "text-ink-700")}>
          <span className={cn("grid h-4 w-4 place-items-center rounded-full", i < at ? "bg-green-600 text-white" : i === at ? "ring-2 ring-green-600/25" : "ring-1 ring-sand-300")}>
            {i < at ? <IconCheck width={10} height={10} strokeWidth={3} /> : i === at ? <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-green-600" /> : null}
          </span>
          <span className={cn(i === at && "shimmer-text")}>{s.label}</span>
        </li>
      ))}
    </ol>
  );
}

function AssistantMessage({ m, idx, last, onRegenerate }: { m: Msg; idx: number; last: boolean; onRegenerate?: () => void }) {
  const t = useTranslations("app.advisor");
  const [hl, setHl] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const id = `m${idx}`;
  const cite = (n: number) => {
    setHl(n);
    requestAnimationFrame(() => document.getElementById(`${id}-src-${n}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    setTimeout(() => setHl(null), 2200);
  };
  const streaming = m.pending && !!m.content;
  return (
    <div className="msg-in flex gap-3 sm:gap-4">
      <span className="relative mt-0.5 block h-8 w-8 shrink-0">
        {m.pending && <span className="absolute -inset-1 animate-pulse-soft rounded-[12px] bg-green-500/25 blur-[3px]" aria-hidden />}
        <LogoMark className="relative h-8 w-8" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="mb-2 flex h-8 items-center gap-2 text-sm font-semibold text-ink-900">
          {t("assistant")}
          {!m.pending && m.sources.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/15">
              <IconShield width={11} height={11} /> {t("grounded")}
            </span>
          )}
        </p>
        <SourceStrip id={id} sources={m.sources} highlight={hl} />
        {m.limit ? (
          <UpgradeNotice kind="chat" limit={m.limit} />
        ) : m.pending && !m.content ? (
          <Progress phase={m.phase} count={m.sources.length} />
        ) : (
          <div className={cn(streaming && "streaming")}>
            <Markdown text={m.content} onCite={cite} />
          </div>
        )}
        {m.error && <p className="mt-2 rounded-lg border border-sand-200 bg-sand-50 px-3 py-2 text-sm text-ink-700">{t("error")}</p>}
        {!m.pending && m.content && !m.limit && (
          <div className="mt-3 flex items-center gap-1 text-ink-400">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(m.content).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs transition hover:bg-sand-100 hover:text-ink-900"
            >
              {copied ? <IconCheck width={14} height={14} /> : <IconCopy width={14} height={14} />} {copied ? t("copied") : t("copy")}
            </button>
            {last && onRegenerate && (
              <button type="button" onClick={onRegenerate} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs transition hover:bg-sand-100 hover:text-ink-900">
                <IconRefresh width={14} height={14} /> {t("regenerate")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSend,
  onStop,
  busy,
  big,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  busy: boolean;
  big?: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const t = useTranslations("app.advisor");
  // Grow with the text up to a limit.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value, inputRef]);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSend();
      }}
      className={cn(
        "composer group relative rounded-[22px] border border-sand-200 bg-white transition focus-within:border-sand-300",
        big ? "p-3 shadow-[0_1px_2px_rgb(11_13_18/.04),0_24px_48px_-24px_rgb(31_63_176/.35)]" : "p-2.5 shadow-[0_1px_2px_rgb(11_13_18/.04),0_12px_32px_-16px_rgb(11_13_18/.22)]",
      )}
    >
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            onSend();
          }
        }}
        rows={1}
        maxLength={2000}
        placeholder={t("placeholder")}
        aria-label={t("placeholder")}
        className={cn("block w-full resize-none bg-transparent px-2 text-ink-900 outline-none placeholder:text-ink-400", big ? "min-h-[3.25rem] py-1.5 text-base" : "min-h-[2.5rem] py-1.5 text-[15px]")}
      />
      <div className="mt-1 flex items-center justify-between gap-2 ps-1">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sand-100 px-2.5 py-1 text-[11.5px] font-medium text-ink-500">
          <IconShield width={12} height={12} className="text-green-600" />
          <span className="hidden sm:inline">REGA · ZATCA · MOJ · Ejar</span>
          <span className="sm:hidden">{t("sources")}</span>
        </span>
        {busy ? (
          <button type="button" onClick={onStop} aria-label={t("stop")} title={t("stop")} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-night-950 text-white transition hover:bg-night-800">
            <IconStop width={16} height={16} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={value.trim().length < 2}
            aria-label={t("send")}
            title={t("send")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-night-950 text-white transition hover:bg-green-600 disabled:bg-sand-200 disabled:text-ink-400"
          >
            <IconSend width={17} height={17} />
          </button>
        )}
      </div>
    </form>
  );
}

export function AdvisorChat({
  threads: initialThreads,
  threadId: initialThreadId,
  initialMessages,
  initialQuestion,
  aiMode,
  firstName,
  quota,
}: {
  threads: ChatThread[];
  threadId: string | null;
  initialMessages: Msg[];
  initialQuestion: string | null;
  aiMode: boolean;
  firstName?: string;
  /** Free-plan allowance: questions left this month, or null on Pro. */
  quota: { left: number; limit: number } | null;
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
  const [left, setLeft] = useState(quota?.left ?? null);
  const scroller = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const abort = useRef<AbortController | null>(null);
  const stick = useRef(true);
  const started = useRef(false);
  const suggestions = t.raw("suggestions") as { title: string; q: string }[];

  // Follow the answer while it streams, unless the reader has scrolled up.
  useEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTo({ top: el.scrollHeight, behavior: busy ? "auto" : "smooth" });
  }, [messages, busy]);

  const send = useCallback(
    async (question: string, opts: { replaceLast?: boolean } = {}) => {
      const q = question.trim();
      if (q.length < 2 || busy) return;
      setBusy(true);
      setInput("");
      stick.current = true;
      setMessages((ms) => {
        const base = opts.replaceLast ? ms.slice(0, -2) : ms;
        return [...base, { role: "user", content: q, sources: [] }, { role: "assistant", content: "", sources: [], pending: true, phase: "search" }];
      });
      const patch = (fn: (m: Msg) => Msg) => setMessages((ms) => ms.map((m, i) => (i === ms.length - 1 ? fn(m) : m)));
      const ctrl = new AbortController();
      abort.current = ctrl;
      try {
        const res = await fetch("/api/app/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q, threadId, locale }), signal: ctrl.signal });
        if (res.status === 402) {
          const data = await res.json().catch(() => ({}));
          setLeft(0);
          patch((m) => ({ ...m, pending: false, limit: data.limit ?? quota?.limit ?? 10 }));
          return;
        }
        if (!res.ok || !res.body) throw new Error(String(res.status));
        setLeft((n) => (n === null ? null : Math.max(0, n - 1)));
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
              patch((m) => ({ ...m, sources: ev.sources, phase: "read" }));
              setTimeout(() => patch((m) => (m.pending && !m.content ? { ...m, phase: "write" } : m)), 700);
              if (ev.threadId && ev.threadId !== threadId) {
                setThreadId(ev.threadId);
                const now = new Date().toISOString();
                setThreads((ts) => [{ id: ev.threadId, title: q.slice(0, 120), created_at: now, updated_at: now }, ...ts.filter((x) => x.id !== ev.threadId)]);
                window.history.replaceState(null, "", `/${locale}/app/advisor?t=${ev.threadId}`);
              }
            } else if (ev.type === "delta") patch((m) => ({ ...m, content: m.content + ev.text, phase: "write" }));
            else if (ev.type === "error") patch((m) => ({ ...m, error: true }));
          }
        }
        patch((m) => ({ ...m, pending: false }));
      } catch {
        patch((m) => (ctrl.signal.aborted ? { ...m, pending: false } : { ...m, pending: false, error: true }));
      } finally {
        abort.current = null;
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

  // Group conversations by recency.
  const now = Date.now();
  const groups: { label: string; items: ChatThread[] }[] = [
    { label: t("today"), items: [] },
    { label: t("week"), items: [] },
    { label: t("older"), items: [] },
  ];
  for (const th of threads) {
    const age = now - new Date(th.updated_at).getTime();
    groups[age < 86400000 ? 0 : age < 7 * 86400000 ? 1 : 2].items.push(th);
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content;

  const history = (
    <aside className={cn("flex w-72 shrink-0 flex-col border-e border-sand-200 bg-sand-50", showHistory ? "fixed inset-y-0 start-0 z-50 shadow-frame lg:static lg:shadow-none" : "hidden lg:flex")}>
      <div className="flex items-center gap-2 p-3">
        <Link
          href="/app/advisor"
          onClick={() => setShowHistory(false)}
          className="flex flex-1 items-center gap-2 rounded-xl border border-sand-200 bg-white px-3 py-2.5 text-sm font-medium text-ink-900 shadow-[0_1px_2px_rgb(11_13_18/.04)] transition hover:border-sand-300"
        >
          <IconPlus width={16} height={16} /> {t("new")}
        </Link>
        <button type="button" onClick={() => setShowHistory(false)} className="grid h-10 w-10 place-items-center rounded-xl text-ink-500 hover:bg-sand-200 lg:hidden" aria-label={t("hideHistory")}>
          <IconX width={16} height={16} />
        </button>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4" aria-label={t("history")}>
        {threads.length === 0 && <p className="px-3 py-2 text-sm text-ink-400">{t("noHistory")}</p>}
        {groups.map(
          (g) =>
            g.items.length > 0 && (
              <div key={g.label} className="mb-3">
                <p className="px-3 pb-1 pt-2 text-[11px] font-medium text-ink-400">{g.label}</p>
                {g.items.map((th) => (
                  <div key={th.id} className={cn("group relative flex items-center rounded-lg transition", th.id === threadId ? "bg-white shadow-[0_1px_2px_rgb(11_13_18/.06)] ring-1 ring-sand-200" : "hover:bg-sand-100")}>
                    <Link href={`/app/advisor?t=${th.id}`} onClick={() => setShowHistory(false)} className="min-w-0 flex-1 px-3 py-2" title={th.title}>
                      <span className={cn("block truncate text-[13.5px]", th.id === threadId ? "font-medium text-ink-900" : "text-ink-700")}>{th.title}</span>
                    </Link>
                    <button type="button" onClick={() => remove(th.id)} className="me-1 hidden h-7 w-7 shrink-0 place-items-center rounded-md text-ink-400 hover:bg-sand-200 hover:text-ink-900 group-hover:grid" aria-label={t("delete")} title={t("delete")}>
                      <IconTrash width={14} height={14} />
                    </button>
                  </div>
                ))}
              </div>
            ),
        )}
      </nav>
    </aside>
  );

  const empty = messages.length === 0;
  const tb = useTranslations("app.billing");
  const quotaLine =
    left !== null && quota ? (
      <p className="mt-2 text-center text-xs text-ink-500">
        {tb("left", { n: left, limit: quota.limit })}
        {" · "}
        <Link href="/app/billing" className="font-medium text-green-700 hover:underline">{tb("upgrade")}</Link>
      </p>
    ) : null;

  return (
    <div className="flex h-full min-h-0">
      {history}
      {showHistory && <button type="button" aria-label={t("hideHistory")} className="fixed inset-0 z-40 bg-night-950/30 lg:hidden" onClick={() => setShowHistory(false)} />}

      <div className="relative flex min-w-0 flex-1 flex-col bg-white">
        <div className="flex items-center gap-2 px-4 pt-3 lg:hidden">
          <button type="button" onClick={() => setShowHistory(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-sand-200 px-2.5 py-1.5 text-xs font-medium text-ink-700">
            <IconHistory width={14} height={14} /> {t("history")}
          </button>
          <Link href="/app/advisor" className="inline-flex items-center gap-1.5 rounded-lg border border-sand-200 px-2.5 py-1.5 text-xs font-medium text-ink-700">
            <IconPlus width={14} height={14} /> {t("new")}
          </Link>
        </div>

        {empty ? (
          <div className="ai-stage relative flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-4 pb-10 pt-[9vh]">
            <div className="ai-orb" aria-hidden />
            <div className="relative w-full max-w-[44rem]">
              <div className="flex flex-col items-center text-center">
                <span className="relative">
                  <span className="absolute -inset-3 rounded-[20px] bg-green-500/15 blur-xl" aria-hidden />
                  <LogoMark className="relative h-12 w-12 shadow-[0_10px_30px_-10px_rgb(31_63_176/.7)]" />
                </span>
                {firstName && <p className="mt-6 text-sm font-medium text-green-600">{t("hi", { name: firstName })}</p>}
                <h1 className={cn("text-balance text-[1.75rem] font-semibold tracking-[-0.025em] text-ink-900 sm:text-[2.1rem]", firstName ? "mt-1.5" : "mt-6")}>{t("greeting")}</h1>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-500 sm:text-[15px]">{t("emptyBody")}</p>
              </div>
              <div className="mt-8">
                <Composer value={input} onChange={setInput} onSend={() => send(input)} onStop={() => abort.current?.abort()} busy={busy} big inputRef={textarea} />
                {!aiMode && <p className="mt-3 rounded-lg border border-sand-200 bg-sand-50 px-3 py-2 text-xs text-ink-500">{t("libraryMode")}</p>}
              </div>
              <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {suggestions.map((s, i) => {
                  const Icon = suggestionIcons[i % suggestionIcons.length] ?? IconCalc;
                  return (
                    <button
                      key={s.q}
                      type="button"
                      onClick={() => send(s.q)}
                      className="group flex items-start gap-3 rounded-2xl border border-sand-200 bg-white/80 p-3.5 text-start backdrop-blur transition hover:border-sand-300 hover:bg-white hover:shadow-[0_8px_24px_-16px_rgb(11_13_18/.35)]"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-green-50 text-green-600 transition group-hover:bg-green-600 group-hover:text-white">
                        <Icon width={16} height={16} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[12px] font-medium text-ink-400">{s.title}</span>
                        <span className="mt-0.5 block text-[13.5px] leading-snug text-ink-800">{s.q}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-6 text-center text-[11px] text-ink-400">{t("disclaimer")}</p>
              {quotaLine}
            </div>
          </div>
        ) : (
          <>
            <div
              ref={scroller}
              onScroll={(e) => {
                const el = e.currentTarget;
                stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
              }}
              className="min-h-0 flex-1 overflow-y-auto"
            >
              <div className="mx-auto max-w-3xl space-y-9 px-4 pb-10 pt-8 sm:px-6">
                {messages.map((m, i) =>
                  m.role === "user" ? (
                    <div key={i} className="msg-in flex justify-end">
                      <p className="max-w-[85%] whitespace-pre-wrap rounded-[20px] rounded-ee-md bg-sand-100 px-4 py-2.5 text-[15px] leading-relaxed text-ink-900">{m.content}</p>
                    </div>
                  ) : (
                    <AssistantMessage key={i} m={m} idx={i} last={i === messages.length - 1} onRegenerate={!busy && lastUser ? () => send(lastUser, { replaceLast: true }) : undefined} />
                  ),
                )}
              </div>
            </div>

            <div className="relative px-4 pb-4 sm:px-6">
              <div className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-white to-transparent" aria-hidden />
              <div className="mx-auto max-w-3xl">
                {!aiMode && <p className="mb-2 rounded-lg border border-sand-200 bg-sand-50 px-3 py-2 text-xs text-ink-500">{t("libraryMode")}</p>}
                <Composer value={input} onChange={setInput} onSend={() => send(input)} onStop={() => abort.current?.abort()} busy={busy} inputRef={textarea} />
                {quotaLine}
                <p className="mt-2 hidden text-center text-[11px] text-ink-400 sm:block">{t("disclaimer")}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
