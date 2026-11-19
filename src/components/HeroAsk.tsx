"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { openMiftah } from "@/lib/hooks/use-user";
import { LogoMark } from "./Logo";
import { IconArrow } from "./Icons";

export function HeroAsk() {
  const t = useTranslations("home.hero");
  const [q, setQ] = useState("");
  const suggestions = t.raw("suggestions") as string[];

  // Answers right here in the Miftah AI window: no sign-up needed for the first questions.
  function go(question: string) {
    openMiftah(question.trim() || undefined);
    setQ("");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    go(q);
  }

  return (
    <div className="w-full max-w-xl">
      <form onSubmit={onSubmit} className="group flex items-center gap-2 rounded-xl border border-sand-200 bg-white p-1.5 shadow-frame transition focus-within:border-green-500">
        <LogoMark className="ms-1 h-8 w-8" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("askPlaceholder")}
          aria-label={t("askPlaceholder")}
          className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-[0.95rem] text-ink-900 outline-none placeholder:text-ink-400"
        />
        <button type="submit" className="btn btn-primary !rounded-lg !px-4 !py-2.5 text-sm">
          {t("askButton")}
          <IconArrow width={16} height={16} className="flip-rtl" />
        </button>
      </form>
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => go(s)}
            className="shrink-0 rounded-full border border-sand-200 bg-white px-3 py-1.5 text-xs text-ink-500 transition hover:border-sand-300 hover:text-ink-900"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
