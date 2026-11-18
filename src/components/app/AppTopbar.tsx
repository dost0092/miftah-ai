"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LogoMark } from "@/components/Logo";
import { getBrowserSupabase } from "@/lib/supabase-auth";
import { cn } from "@/lib/format";
import { IconBook, IconChat, IconExternal, IconLogout, IconPin, IconSearch, IconUser } from "@/components/Icons";

type Results = { districts: { slug: string; nameEn: string; nameAr: string; city: string }[]; documents: { id: string; title: string; category: string; excerpt: string }[] };

function useClickOutside(ref: React.RefObject<HTMLElement | null>, close: () => void) {
  useEffect(() => {
    const onDoc = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, close]);
}

function GlobalSearch() {
  const t = useTranslations("app.search");
  const locale = useLocale();
  const rtl = locale === "ar" || locale === "ur";
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [res, setRes] = useState<Results | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useClickOutside(box, () => setOpen(false));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) return setRes(null);
    const ctrl = new AbortController();
    const id = setTimeout(() => {
      fetch(`/api/app/search?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setRes(d))
        .catch(() => {});
    }, 180);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [q]);

  const go = (href: string, log?: string) => {
    if (log) fetch("/api/app/activity", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "search", title: log, href }) }).catch(() => {});
    setOpen(false);
    setQ("");
    router.push(href);
  };
  const ask = () => q.trim().length > 1 && go(`/app/advisor?q=${encodeURIComponent(q.trim())}`);

  return (
    <div ref={box} className="relative w-full max-w-xl">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          ask();
        }}
        className="flex items-center gap-2.5 rounded-xl border border-transparent bg-sand-100 px-3.5 py-2 transition focus-within:border-green-500 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgb(42_80_216/.12)]"
      >
        <IconSearch width={17} height={17} className="shrink-0 text-ink-400" />
        <input
          ref={input}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
        />
        <kbd className="hidden rounded-md border border-sand-300 bg-white px-1.5 py-0.5 font-mono text-[10px] text-ink-400 lg:block" dir="ltr">Ctrl K</kbd>
      </form>

      {open && q.trim().length > 1 && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-sand-200 bg-white shadow-frame">
          <button type="button" onClick={ask} className="flex w-full items-center gap-3 border-b border-sand-200 px-4 py-3 text-start text-sm font-medium text-ink-900 hover:bg-green-50">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-green-600 text-white"><IconChat width={15} height={15} /></span>
            <span className="truncate">{t("ask", { q: q.trim() })}</span>
          </button>
          {res && res.districts.length > 0 && (
            <div className="py-1.5">
              <p className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">{t("districts")}</p>
              {res.districts.map((d) => (
                <button key={d.slug} type="button" onClick={() => go(`/app/map?d=${d.slug}`, d.nameEn)} className="flex w-full items-center gap-3 px-4 py-2 text-start text-sm hover:bg-sand-50">
                  <IconPin width={16} height={16} className="shrink-0 text-ink-400" />
                  <span className="font-medium text-ink-900">{rtl ? d.nameAr : d.nameEn}</span>
                  <span className="text-xs capitalize text-ink-400">{d.city}</span>
                </button>
              ))}
            </div>
          )}
          {res && res.documents.length > 0 && (
            <div className="border-t border-sand-200 py-1.5">
              <p className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">{t("documents")}</p>
              {res.documents.map((d) => (
                <button key={d.id} type="button" onClick={() => go(`/app/library?doc=${d.id}#${d.id}`, d.title)} className="flex w-full items-start gap-3 px-4 py-2 text-start hover:bg-sand-50">
                  <IconBook width={16} height={16} className="mt-0.5 shrink-0 text-ink-400" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink-900">{d.title}</span>
                    <span className="block truncate text-xs text-ink-400">{d.excerpt}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {res && res.districts.length === 0 && res.documents.length === 0 && <p className="px-4 py-3 text-sm text-ink-400">{t("empty")}</p>}
        </div>
      )}
    </div>
  );
}

function UserMenu({ name, email, preview }: { name: string; email: string; preview: boolean }) {
  const t = useTranslations("app.nav");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useClickOutside(box, () => setOpen(false));
  const initial = (name || email || "?").trim().charAt(0).toUpperCase();

  async function signOut() {
    await getBrowserSupabase()?.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="grid h-9 w-9 place-items-center rounded-full bg-night-950 text-sm font-semibold text-white ring-2 ring-white transition hover:ring-green-100" title={email}>
        {initial}
      </button>
      {open && (
        <div className="absolute end-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-sand-200 bg-white py-1.5 shadow-frame">
          <div className="border-b border-sand-200 px-4 pb-3 pt-2">
            <p className="truncate text-sm font-semibold text-ink-900">{name}</p>
            <p className="truncate text-xs text-ink-400" dir="ltr">{email}</p>
          </div>
          <Link href="/app/account" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink-700 hover:bg-sand-50"><IconUser width={16} height={16} className="text-ink-400" /> {t("account")}</Link>
          <Link href="/" className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink-700 hover:bg-sand-50"><IconExternal width={16} height={16} className="text-ink-400" /> {t("backToSite")}</Link>
          {!preview && (
            <button type="button" onClick={signOut} className="flex w-full items-center gap-2.5 px-4 py-2 text-start text-sm text-ink-700 hover:bg-sand-50"><IconLogout width={16} height={16} className="flip-rtl text-ink-400" /> {t("signOut")}</button>
          )}
        </div>
      )}
    </div>
  );
}

export function AppTopbar({ name, email, preview }: { name: string; email: string; preview: boolean }) {
  const t = useTranslations("app");
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-sand-200 bg-white/90 px-4 backdrop-blur print:hidden sm:px-6">
      <Link href="/app" className="md:hidden" aria-label="Miftah AI"><LogoMark className="h-8 w-8" /></Link>
      <GlobalSearch />
      <div className="ms-auto flex items-center gap-2 sm:gap-3">
        {preview && <span className={cn("hidden rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 lg:inline")}>{t("preview")}</span>}
        <LanguageSwitcher className="hidden sm:block" />
        <span className="hidden h-6 w-px bg-sand-200 sm:block" />
        <UserMenu name={name} email={email} preview={preview} />
      </div>
    </header>
  );
}
