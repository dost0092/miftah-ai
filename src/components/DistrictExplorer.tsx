"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { districts, trendChange, type City, type PropertyType } from "@/lib/districts";
import { cn, fmtNumber, fmtPercent } from "@/lib/format";
import { IconArrow, IconSearch } from "./Icons";
import { Sparkline } from "./Sparkline";
import { ZoneBadge } from "./ZoneBadge";

type Sort = "deals" | "priceHigh" | "priceLow" | "trend";

export function DistrictExplorer({ limit }: { limit?: number }) {
  const t = useTranslations("districts");
  const c = useTranslations("common");
  const locale = useLocale();
  const isArabic = locale === "ar" || locale === "ur";
  const [city, setCity] = useState<City | "all">("all");
  const [type, setType] = useState<PropertyType>("apartment");
  const [sort, setSort] = useState<Sort>("deals");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = districts.filter(
      (d) => (city === "all" || d.city === city) && (!needle || d.nameEn.toLowerCase().includes(needle) || d.nameAr.includes(needle)),
    );
    const sorted = [...list].sort((a, b) => {
      if (sort === "deals") return b.deals - a.deals;
      if (sort === "priceHigh") return b.median[type] - a.median[type];
      if (sort === "priceLow") return a.median[type] - b.median[type];
      return trendChange(b) - trendChange(a);
    });
    return limit ? sorted.slice(0, limit) : sorted;
  }, [city, type, sort, q, limit]);

  const pill = (active: boolean) =>
    cn("rounded-full px-3.5 py-1.5 text-sm font-medium transition", active ? "bg-green-600 text-white shadow-sm" : "text-ink-500 hover:text-ink-900");

  return (
    <div className="card overflow-hidden">
      {/* toolbar */}
      <div className="flex flex-col gap-3 border-b border-sand-200 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full bg-sand-100 p-1">
            {(["all", "riyadh", "jeddah"] as const).map((k) => (
              <button key={k} type="button" onClick={() => setCity(k)} className={pill(city === k)}>
                {c(`city.${k}`)}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-full bg-sand-100 p-1" role="group" aria-label={t("type")}>
            {(["apartment", "villa", "land"] as const).map((k) => (
              <button key={k} type="button" onClick={() => setType(k)} className={pill(type === k)}>
                {c(`type.${k}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <label className="relative flex-1 lg:w-56">
            <IconSearch width={16} height={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="input !rounded-full !py-2 !ps-9 text-sm" />
          </label>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label={t("sort")} className="input !w-auto !rounded-full !py-2 text-sm">
            <option value="deals">{t("sortDeals")}</option>
            <option value="priceHigh">{t("sortPriceHigh")}</option>
            <option value="priceLow">{t("sortPriceLow")}</option>
            <option value="trend">{t("sortTrend")}</option>
          </select>
        </div>
      </div>

      {/* table (desktop) */}
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand-200 bg-sand-50 text-start text-xs font-semibold uppercase tracking-wide text-ink-400">
              <th className="px-5 py-3 text-start">{t("district")}</th>
              <th className="px-5 py-3 text-end">{c("medianPrice")} ({c("perSqm")})</th>
              <th className="px-5 py-3 text-end">{c("deals")}</th>
              <th className="px-5 py-3 text-start">{c("trend12m")}</th>
              <th className="px-5 py-3 text-start">{c("foreignZone")}</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const ch = trendChange(d);
              return (
                <tr key={d.slug} className="group border-b border-sand-100 transition last:border-0 hover:bg-green-50/40">
                  <td className="px-5 py-3.5">
                    <Link href={`/districts/${d.slug}`} className="block">
                      <span className="font-semibold text-ink-900">{isArabic ? d.nameAr : d.nameEn}</span>
                      <span className="ms-2 text-ink-400" lang={isArabic ? "en" : "ar"}>{isArabic ? d.nameEn : d.nameAr}</span>
                      <span className="block text-xs text-ink-400">{c(`city.${d.city}`)}</span>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-end font-semibold tabular-nums text-ink-900" dir="ltr">{fmtNumber(locale, d.median[type])}</td>
                  <td className="px-5 py-3.5 text-end tabular-nums text-ink-700" dir="ltr">{fmtNumber(locale, d.deals)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Sparkline id={d.slug} values={d.trend} stroke={ch >= 0 ? "#2a50d8" : "#8b919b"} className="h-7 w-20" />
                      <span className={cn("text-xs font-semibold tabular-nums", ch >= 0 ? "text-emerald-700" : "text-ink-500")} dir="ltr">{fmtPercent(locale, ch)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><ZoneBadge status={d.zone} label={c(`zone.${d.zone}`)} /></td>
                  <td className="px-5 py-3.5 text-end">
                    <Link href={`/districts/${d.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 opacity-60 transition group-hover:opacity-100">
                      {t("view")} <IconArrow width={14} height={14} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* cards (mobile) */}
      <ul className="divide-y divide-sand-100 md:hidden">
        {rows.map((d) => {
          const ch = trendChange(d);
          return (
            <li key={d.slug}>
              <Link href={`/districts/${d.slug}`} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-semibold text-ink-900">{isArabic ? d.nameAr : d.nameEn}</p>
                  <p className="text-xs text-ink-400">{c(`city.${d.city}`)} · {fmtNumber(locale, d.deals)} {c("deals")}</p>
                  <ZoneBadge status={d.zone} label={c(`zone.${d.zone}`)} className="mt-2" />
                </div>
                <div className="text-end">
                  <p className="font-semibold tabular-nums" dir="ltr">{fmtNumber(locale, d.median[type])}</p>
                  <p className="text-xs text-ink-400">{c("perSqm")}</p>
                  <p className={cn("mt-1 text-xs font-semibold", ch >= 0 ? "text-emerald-700" : "text-ink-500")} dir="ltr">{fmtPercent(locale, ch)}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {rows.length === 0 && <p className="p-10 text-center text-ink-400">{t("empty")}</p>}
    </div>
  );
}
