"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { getDistrict, trendChange } from "@/lib/districts";
import { fmtNumber, fmtPercent, cn } from "@/lib/format";
import { IconCheck, IconDoc, IconFlag } from "./Icons";
import { LogoMark } from "./Logo";
import { ZoneBadge } from "./ZoneBadge";
import { Sparkline } from "./Sparkline";


export function ChatDemo() {
  const t = useTranslations("home.demo");
  const c = useTranslations("common");
  const locale = useLocale();
  const d = getDistrict("al-malqa")!;
  const [stage, setStage] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // The demo lives in the hero, so play it straight away on load.
    const timers = [500, 1400, 2200, 3000].map((ms, i) => setTimeout(() => setStage(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, []);

  const change = trendChange(d);

  return (
    <div ref={ref} className="relative">
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-frame">
        {/* window chrome */}
        <div className="flex items-center justify-between border-b border-sand-200 bg-sand-50/70 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-sand-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-sand-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-sand-300" />
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-400">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
            {t("label")}
          </span>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          {/* user */}
          <div className="flex justify-end">
            <p className="max-w-[85%] rounded-2xl rounded-ee-md bg-night-950 px-4 py-3 text-sm leading-relaxed text-white">{t("question")}</p>
          </div>

          {/* agent */}
          <div className="flex gap-3">
            <LogoMark className="h-8 w-8" />
            <div className="min-w-0 flex-1 space-y-3">
              {/* what was checked, in plain words */}
              <div className="flex flex-wrap gap-1.5">
                {(t.raw("checks") as string[]).map((label, i) => {
                  const done = stage >= i + 2;
                  const visible = stage >= i + 1;
                  return (
                    <span
                      key={label}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium transition-opacity duration-300",
                        visible ? "opacity-100" : "opacity-0",
                        done ? "border-green-600/20 bg-green-50 text-green-700" : "border-sand-200 bg-sand-50 text-ink-500",
                      )}
                    >
                      {done ? <IconCheck width={12} height={12} /> : <span className="h-1.5 w-1.5 rounded-full bg-ink-400" />}
                      {label}
                    </span>
                  );
                })}
              </div>

              <div className={cn("space-y-3 transition-all duration-700", stage >= 3 ? "opacity-100" : "opacity-0")}>
                <p className="text-sm text-ink-700">{t("intro")}</p>
                <div className="grid grid-cols-3 gap-2">
                  <Stat label={c("medianPrice")} value={fmtNumber(locale, d.median.apartment)} unit={c("perSqm")} />
                  <Stat label={c("deals")} value={fmtNumber(locale, d.deals)} unit="Q3 2026" />
                  <Stat label={c("trend12m")} value={fmtPercent(locale, change)} unit={<Sparkline id="demo" values={d.trend} className="h-5 w-16" />} />
                </div>
                <div className="flex items-start gap-2 rounded-xl border border-sand-200 bg-sand-50 p-3">
                  <ZoneBadge status={d.zone} label={c(`zone.${d.zone}`)} />
                  <p className="text-xs leading-relaxed text-ink-500">{t("zoneLine")}</p>
                </div>
              </div>

              <div className={cn("flex flex-wrap items-center justify-between gap-2 border-t border-sand-200 pt-3 transition-all duration-700", stage >= 4 ? "opacity-100" : "opacity-0")}>
                <p className="text-[11px] text-ink-400">
                  <span className="font-semibold text-gold-700">{t("example")}</span> · {c("sampleData")}
                </p>
                <div className="flex gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-night-950 px-2 py-1 text-[11px] font-medium text-white">
                    <IconDoc width={12} height={12} />
                    {t("reportButton")}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-ink-400">
                    <IconFlag width={12} height={12} />
                    {t("flag")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-sand-200 p-2.5">
      <p className="truncate text-[10.5px] font-medium text-ink-400">{label}</p>
      <p className="mt-1 text-base font-semibold text-ink-900 sm:text-lg" dir="ltr">{value}</p>
      <div className="mt-0.5 text-[10.5px] text-ink-400">{unit}</div>
    </div>
  );
}
