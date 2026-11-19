"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { FEES_CHECKED, feeRules, type FeeRule } from "@/lib/fees";
import { cn, fmtNumber } from "@/lib/format";
import { IconArrow } from "./Icons";

type Mode = "buy" | "sell";

export function CostCalculator() {
  const t = useTranslations("calculator");
  const locale = useLocale();
  const [price, setPrice] = useState(1_500_000);
  const [mode, setMode] = useState<Mode>("buy");
  const [nonSaudi, setNonSaudi] = useState(true);
  const [broker, setBroker] = useState(true);
  const [payRett, setPayRett] = useState(true);
  const [rates, setRates] = useState<Record<FeeRule["id"], number>>(
    Object.fromEntries(feeRules.map((r) => [r.id, r.rate])) as Record<FeeRule["id"], number>,
  );

  const lines = useMemo(() => {
    const out: Array<{ rule: FeeRule; amount: number; rate: number }> = [];
    const brokerage = broker ? price * rates.brokerage : 0;
    for (const rule of feeRules) {
      if (rule.appliesTo !== "both" && rule.appliesTo !== mode) continue;
      if (rule.id === "rett" && !payRett) continue;
      if ((rule.id === "brokerage" || rule.id === "brokerageVat") && !broker) continue;
      if (rule.id === "disposal" && !nonSaudi) continue;
      const amount = rule.id === "brokerageVat" ? brokerage * rates.brokerageVat : price * rates[rule.id];
      out.push({ rule, amount, rate: rates[rule.id] });
    }
    return out;
  }, [price, mode, nonSaudi, broker, payRett, rates]);

  const total = lines.reduce((s, l) => s + l.amount, 0);
  const grand = mode === "buy" ? price + total : price - total;

  const toggle = (on: boolean, set: (v: boolean) => void, label: string) => (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-sand-200 bg-white px-4 py-3 text-sm font-medium">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => set(!on)}
        className={cn("relative h-6 w-11 shrink-0 rounded-full transition", on ? "bg-green-600" : "bg-sand-300")}
      >
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "start-[22px]" : "start-0.5")} />
      </button>
    </label>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
      {/* inputs */}
      <div className="card space-y-5 p-6">
        <div>
          <label htmlFor="price" className="text-sm font-semibold text-ink-700">{t("price")}</label>
          <div className="relative mt-2">
            <input
              id="price"
              inputMode="numeric"
              dir="ltr"
              value={fmtNumber(locale, price)}
              onChange={(e) => setPrice(Number(e.target.value.replace(/[^\d]/g, "")) || 0)}
              className="input !py-4 !pe-16 text-2xl font-semibold tabular-nums"
            />
            <span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-400">SAR</span>
          </div>
          <input
            type="range"
            min={300_000}
            max={10_000_000}
            step={50_000}
            value={Math.min(Math.max(price, 300_000), 10_000_000)}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="mt-4 w-full accent-green-600"
            aria-label={t("price")}
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-ink-700">{t("mode")}</p>
          <div className="mt-2 grid grid-cols-2 gap-1 rounded-full bg-sand-100 p-1">
            {(["buy", "sell"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn("rounded-full py-2 text-sm font-semibold transition", mode === m ? "bg-white text-green-700 shadow-sm" : "text-ink-500")}
              >
                {t(m)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {toggle(nonSaudi, setNonSaudi, t("isNonSaudi"))}
          {toggle(broker, setBroker, t("includeBrokerage"))}
          {toggle(payRett, setPayRett, t("rettPayer"))}
        </div>
        <p className="text-xs text-ink-400">{t("editRates")}</p>
        <p className="text-xs text-ink-400">{t("checked", { date: FEES_CHECKED })}</p>
      </div>

      {/* results */}
      <div className="card overflow-hidden">
        <div className="border-b border-sand-200 bg-sand-50 px-6 py-4">
          <p className="font-semibold">{t("breakdown")}</p>
        </div>
        <ul className="divide-y divide-sand-100">
          {lines.map(({ rule, amount, rate }) => (
            <li key={rule.id} className="flex items-start justify-between gap-4 px-6 py-4">
              <div className="min-w-0">
                <p className="font-semibold text-ink-900">{t(`fees.${rule.id}.name`)}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-500">{t(`fees.${rule.id}.note`)}</p>
                <a href={rule.source} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-green-700 hover:underline">
                  {t("rule")} <IconArrow width={12} height={12} />
                </a>
              </div>
              <div className="shrink-0 text-end">
                <label className="inline-flex items-center gap-1 rounded-lg bg-sand-100 px-2 py-1 text-xs font-semibold text-ink-500" dir="ltr">
                  <input
                    type="number"
                    step={0.1}
                    min={0}
                    max={100}
                    value={+(rate * 100).toFixed(2)}
                    onChange={(e) => setRates((r) => ({ ...r, [rule.id]: Math.max(0, Number(e.target.value)) / 100 }))}
                    className="w-12 bg-transparent text-end outline-none"
                    aria-label={`${t("rate")} ${t(`fees.${rule.id}.name`)}`}
                  />
                  %
                </label>
                <p className="mt-2 font-semibold tabular-nums text-ink-900" dir="ltr">{fmtNumber(locale, amount)} SAR</p>
              </div>
            </li>
          ))}
        </ul>
        {mode === "buy" && nonSaudi && (
          <p className="border-t border-sand-200 bg-gold-100/60 px-6 py-3 text-xs leading-relaxed text-ink-700">{t("sellLater")}</p>
        )}
        <div className="space-y-2 border-t border-sand-200 bg-night-950 px-6 py-5 text-white">
          <div className="flex justify-between text-sm text-white/70">
            <span>{t("total")}</span>
            <span className="tabular-nums" dir="ltr">{fmtNumber(locale, total)} SAR</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="font-semibold">{mode === "buy" ? t("grandBuy") : t("grandSell")}</span>
            <span className="text-3xl font-semibold tabular-nums text-white" dir="ltr">{fmtNumber(locale, grand)} <span className="text-base">SAR</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
