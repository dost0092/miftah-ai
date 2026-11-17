"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeNames, locales, type Locale } from "@/i18n/routing";
import { IconCheck, IconChevron, IconGlobe } from "./Icons";
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
          "inline-flex items-center gap-1.5 rounded-full border border-sand-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 transition hover:border-sand-300",
          pending && "opacity-60",
        )}
      >
        <IconGlobe width={16} height={16} />
        <span>{localeNames[locale].native}</span>
        <IconChevron width={14} height={14} className={cn("transition", open && "rotate-180")} />
      </button>
      {open && (
        <ul
          role="listbox"
          className={cn(
            "absolute top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-sand-200 bg-white p-1.5 shadow-xl shadow-ink-900/10",
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
                  "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start text-sm transition hover:bg-sand-100",
                  l === locale && "bg-green-50 text-green-700",
                )}
              >
                <span className="flex flex-col">
                  <span className="font-semibold" lang={l}>{localeNames[l].native}</span>
                  <span className="text-xs text-ink-400">{localeNames[l].english}</span>
                </span>
                {l === locale && <IconCheck width={16} height={16} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
