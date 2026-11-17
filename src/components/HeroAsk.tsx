"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { IconArrow, IconSpark } from "./Icons";

export function HeroAsk() {
  const t = useTranslations("home.hero");
  const router = useRouter();
  const [q, setQ] = useState("");
  const suggestions = t.raw("suggestions") as string[];

  function go(question: string) {
    const value = question.trim();
    router.push(value ? { pathname: "/waitlist", query: { q: value } } : "/waitlist");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    go(q);
  }

  return (
    <div className="w-full max-w-xl">
      <form onSubmit={onSubmit} className="group flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.07] p-2 backdrop-blur transition focus-within:border-gold-400/60 focus-within:bg-white/10">
        <IconSpark className="ms-2 shrink-0 text-gold-300" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("askPlaceholder")}
          aria-label={t("askPlaceholder")}
          className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-[0.95rem] text-white outline-none placeholder:text-white/45"
        />
        <button type="submit" className="btn btn-gold !rounded-xl !px-4 !py-2.5 text-sm">
          {t("askButton")}
          <IconArrow width={16} height={16} />
        </button>
      </form>
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => go(s)}
            className="shrink-0 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70 transition hover:border-gold-400/50 hover:text-white"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
