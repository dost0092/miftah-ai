"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeNames, locales, type Locale } from "@/i18n/routing";
import { IconCheck, IconChevron } from "./Icons";
import { Flag } from "./Flag";
import { cn } from "@/lib/format";

export function LanguageSwitcher({ className, align = "end" }: { className?: string; align?: "start" | "end" }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function choose(next: Locale) {
    setOpen(false);
    startTransition(() => router.replace(pathname, { locale: next }));
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("language")}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-lg border border-sand-200 bg-white px-2.5 text-[13px] font-medium text-ink-700 transition hover:border-sand-300 hover:bg-sand-50",
          pending && "opacity-60",
        )}
      >
        <Flag locale={locale} className="h-3 w-[17px]" />
        <span>{localeNames[locale].native}</span>
        <IconChevron width={13} height={13} className={cn("text-ink-400 transition", open && "rotate-180")} />
      </button>
      {open && (
        <ul
          role="listbox"
          className={cn(
            "absolute top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-sand-200 bg-white p-1 shadow-frame",
            align === "end" ? "end-0" : "start-0",
          )}
        >
          {locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => choose(l)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-[13px] transition hover:bg-sand-100",
                  l === locale && "bg-sand-100",
                )}
              >
                <Flag locale={l} className="h-3 w-[17px]" />
                <span className="min-w-0 flex-1 font-medium text-ink-900" lang={l}>{localeNames[l].native}</span>
                <span className="text-[11px] text-ink-400">{localeNames[l].english}</span>
                {l === locale && <IconCheck width={14} height={14} className="text-green-600" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
