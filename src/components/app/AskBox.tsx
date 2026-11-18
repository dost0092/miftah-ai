"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { IconSend, IconSpark } from "@/components/Icons";

/** Big "ask anything" box on the dashboard; sends the question to the advisor. */
export function AskBox() {
  const t = useTranslations("app.dashboard");
  const router = useRouter();
  const [q, setQ] = useState("");
  const chips = t.raw("chips") as string[];
  const ask = (text: string) => text.trim().length > 1 && router.push(`/app/advisor?q=${encodeURIComponent(text.trim())}`);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
        className="flex items-center gap-3 rounded-2xl border border-sand-200 bg-white p-2 ps-4 shadow-[0_0_0_4px_rgb(42_80_216/.06),0_12px_32px_-12px_rgb(11_13_18/.18)] transition focus-within:border-green-500 focus-within:shadow-[0_0_0_4px_rgb(42_80_216/.14),0_12px_32px_-12px_rgb(11_13_18/.18)]"
      >
        <IconSpark width={18} height={18} className="shrink-0 text-green-600" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("askPlaceholder")}
          aria-label={t("askPlaceholder")}
          className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-ink-900 outline-none placeholder:text-ink-400"
        />
        <button type="submit" disabled={q.trim().length < 2} aria-label="Send" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-green-600 text-white transition hover:bg-green-700 disabled:bg-sand-200 disabled:text-ink-400">
          <IconSend width={18} height={18} />
        </button>
      </form>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {chips.map((c) => (
          <button key={c} type="button" onClick={() => ask(c)} className="rounded-full border border-sand-200 bg-white px-3.5 py-1.5 text-sm text-ink-700 transition hover:border-green-300 hover:bg-green-50 hover:text-green-700">
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
