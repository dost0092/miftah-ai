"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { getDistrict, trendChange } from "@/lib/districts";
import { feeRules } from "@/lib/fees";
import { cn, fmtNumber, fmtPercent } from "@/lib/format";
import { Sparkline } from "./Sparkline";
import { IconCalc, IconChat, IconCheck, IconDatabase, IconDoc, IconMap, IconShield, IconTag } from "./Icons";
import { LogoMark } from "./Logo";

const STEP_MS = 7000;
const steps = [
  { key: "ask", Icon: IconChat },
  { key: "zone", Icon: IconShield },
  { key: "price", Icon: IconTag },
  { key: "cost", Icon: IconCalc },
  { key: "report", Icon: IconDoc },
] as const;
type StepKey = (typeof steps)[number]["key"];

/** Interactive, auto-playing walkthrough of the product, rendered as a real app screen. */
export function ProductTour() {
  const t = useTranslations("tour");
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (paused || !visible) return;
    const id = setTimeout(() => setActive((a) => (a + 1) % steps.length), STEP_MS);
    return () => clearTimeout(id);
  }, [active, paused, visible]);

  const current = steps[active].key;

  return (
    <div ref={ref} className="grid gap-8 lg:grid-cols-[340px_1fr] lg:gap-12" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* Step list */}
      <ol className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0" role="tablist" aria-label={t("label")}>
        {steps.map(({ key, Icon }, i) => {
          const on = i === active;
          return (
            <li key={key} className="shrink-0 lg:shrink">
              <button
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setActive(i)}
                className={cn(
                  "relative w-56 overflow-hidden rounded-2xl border p-4 text-start transition lg:w-full lg:p-5",
                  on ? "border-ink-200 bg-white shadow-[0_12px_32px_-20px_rgb(14_23_38/.35)]" : "border-transparent hover:bg-white/60",
                )}
              >
                <span className="flex items-center gap-3">
                  <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl transition", on ? "bg-night-900 text-white" : "bg-sand-200/70 text-ink-500")}>
                    <Icon width={17} height={17} />
                  </span>
                  <span>
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-400">{t("stepN", { n: i + 1 })}</span>
                    <span className={cn("block font-semibold", on ? "text-ink-900" : "text-ink-700")}>{t(`${key}.tab`)}</span>
                  </span>
                </span>
                <span className={cn("mt-3 hidden text-sm leading-relaxed text-ink-500 lg:block", !on && "lg:hidden")}>{t(`${key}.desc`)}</span>
                {on && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-ink-200/60">
                    <span
                      key={`${active}-${paused}-${visible}`}
                      className="block h-full origin-left bg-green-600 rtl:origin-right"
                      style={{ animation: paused || !visible ? "none" : `tour-progress ${STEP_MS}ms linear forwards`, transform: paused || !visible ? "scaleX(0)" : undefined }}
                    />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>

      {/* App window */}
      <div className="min-w-0">
        <div className="overflow-hidden rounded-[20px] border border-ink-200/70 bg-white shadow-[0_40px_80px_-40px_rgb(14_23_38/.45)]">
          <div className="flex items-center gap-3 border-b border-sand-200 bg-sand-50 px-4 py-3">
            <span className="flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-ink-200" /><i className="h-2.5 w-2.5 rounded-full bg-ink-200" /><i className="h-2.5 w-2.5 rounded-full bg-ink-200" /></span>
            <span className="mx-auto truncate rounded-md bg-white px-3 py-1 text-xs text-ink-400 ring-1 ring-sand-200" dir="ltr">miftahai.co/app/{current}</span>
            <span className="hidden rounded-full bg-sand-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-500 sm:block">{t("sample")}</span>
          </div>
          <div className="grid min-h-[440px] sm:grid-cols-[56px_1fr]">
            <aside className="hidden flex-col items-center gap-3 border-e border-sand-200 bg-sand-50/60 py-4 sm:flex">
              <LogoMark className="h-8 w-8" />
              {[IconChat, IconMap, IconCalc, IconDoc].map((I, i) => (
                <span key={i} className={cn("grid h-9 w-9 place-items-center rounded-lg", i === [0, 1, 1, 2, 3][active] ? "bg-white text-green-700 ring-1 ring-sand-200" : "text-ink-400")}>
                  <I width={17} height={17} />
                </span>
              ))}
            </aside>
            <div key={current} className="tour-in p-5 sm:p-7">
              <Screen step={current} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Screen({ step }: { step: StepKey }) {
  const t = useTranslations("tour");
  const c = useTranslations("common");
  const locale = useLocale();
  const rtl = locale === "ar" || locale === "ur";
  const malqa = getDistrict("al-malqa")!;
  const narjis = getDistrict("al-narjis")!;
  const hittin = getDistrict("hittin")!;
  const nm = (d: typeof malqa) => (rtl ? d.nameAr : d.nameEn);
  const sar = (n: number) => fmtNumber(locale, Math.round(n));

  if (step === "ask") {
    return (
      <div className="space-y-4">
        <div className="ms-auto max-w-[85%] rounded-2xl rounded-se-md bg-night-900 px-4 py-3 text-sm text-white">{t("ask.q")}</div>
        <div className="flex flex-wrap gap-2">
          {(["zone", "stats", "cost"] as const).map((k, i) => (
            <span key={k} className="tour-chip inline-flex items-center gap-1.5 rounded-full border border-sand-200 bg-sand-50 px-3 py-1 text-[11px] font-medium text-ink-500" style={{ animationDelay: `${300 + i * 350}ms` }}>
              <IconDatabase width={12} height={12} className="text-green-600" /> {t(`ask.tool.${k}`)} <IconCheck width={12} height={12} className="text-green-600" />
            </span>
          ))}
        </div>
        <div className="tour-chip max-w-[92%] rounded-2xl rounded-ss-md border border-sand-200 bg-white p-4 text-sm leading-relaxed text-ink-700" style={{ animationDelay: "1500ms" }}>
          <p className="font-semibold text-ink-900">{t("ask.a1", { district: nm(malqa) })}</p>
          <p className="mt-2">{t("ask.a2", { price: sar(malqa.median.apartment) })}</p>
          <p className="mt-3 border-t border-sand-100 pt-2 text-xs font-medium text-ink-500">{t("sample")}</p>
        </div>
      </div>
    );
  }

  if (step === "zone") {
    const rows = [
      { label: t("zone.r1"), value: t("zone.v1") },
      { label: t("zone.r2"), value: t("zone.v2") },
      { label: t("zone.r3"), value: t("zone.v3") },
    ];
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">{t("zone.kicker")}</p>
        <h4 className="mt-1 text-2xl font-semibold text-ink-900">{nm(malqa)}, {c("city.riyadh")}</h4>
        <div className="mt-5 flex items-start gap-4 rounded-2xl border border-green-600/15 bg-green-50 p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-green-600 ring-1 ring-green-600/15"><IconShield width={20} height={20} /></span>
          <div>
            <p className="font-semibold text-ink-900">{t("zone.status")}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-500">{t("zone.statusBody")}</p>
          </div>
        </div>
        <dl className="mt-5 divide-y divide-sand-100 rounded-2xl border border-sand-200">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
              <dt className="text-ink-500">{r.label}</dt>
              <dd className="text-end font-medium text-ink-900">{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  if (step === "price") {
    const list = [malqa, hittin, narjis];
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">{t("price.kicker")}</p>
        <h4 className="mt-1 text-2xl font-semibold text-ink-900">{t("price.title")}</h4>
        <div className="mt-5 overflow-hidden rounded-2xl border border-sand-200">
          <table className="w-full text-sm">
            <thead className="bg-sand-50 text-xs text-ink-400">
              <tr>
                <th className="px-4 py-2.5 text-start font-medium">{t("price.colDistrict")}</th>
                <th className="px-4 py-2.5 text-end font-medium">{c("perSqm")}</th>
                <th className="hidden px-4 py-2.5 text-end font-medium sm:table-cell">{t("price.colTrend")}</th>
                <th className="px-4 py-2.5 text-end font-medium">{t("price.colChange")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {list.map((d, i) => {
                const ch = trendChange(d);
                return (
                  <tr key={d.slug} className={cn(i === 0 && "bg-green-50/40")}>
                    <td className="px-4 py-3 font-medium text-ink-900">{nm(d)}</td>
                    <td className="px-4 py-3 text-end tabular-nums" dir="ltr">{sar(d.median.apartment)}</td>
                    <td className="hidden px-4 py-2 sm:table-cell"><Sparkline id={`tour-${d.slug}`} values={d.trend} stroke="#006c35" className="ms-auto h-7 w-24" /></td>
                    <td className={cn("px-4 py-3 text-end font-semibold tabular-nums", ch >= 0 ? "text-emerald-700" : "text-ink-500")} dir="ltr">{fmtPercent(locale, ch)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 rounded-2xl bg-night-900 p-4 text-sm text-white/85">
          <span className="font-semibold text-white">{t("price.verdictLabel")} </span>
          {t("price.verdict", { asking: sar(malqa.median.apartment * 1.12), median: sar(malqa.median.apartment) })}
        </div>
      </div>
    );
  }

  if (step === "cost") {
    const price = 1_500_000;
    const rate = (id: string) => feeRules.find((f) => f.id === id)!.rate;
    const rett = price * rate("rett");
    const brokerage = price * rate("brokerage");
    const vat = brokerage * rate("brokerageVat");
    const total = price + rett + brokerage + vat;
    const rows = [
      { label: t("cost.price"), v: price },
      { label: t("cost.rett"), v: rett, pct: "5%" },
      { label: t("cost.brokerage"), v: brokerage, pct: "2.5%" },
      { label: t("cost.vat"), v: vat, pct: "15%" },
    ];
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">{t("cost.kicker")}</p>
        <h4 className="mt-1 text-2xl font-semibold text-ink-900">{t("cost.title")}</h4>
        <div className="mt-5 space-y-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-4 rounded-xl border border-sand-200 px-4 py-3 text-sm">
              <span className="text-ink-500">{r.label} {r.pct && <span className="ms-1 rounded bg-sand-100 px-1.5 py-0.5 text-[11px] text-ink-400" dir="ltr">{r.pct}</span>}</span>
              <span className="font-medium tabular-nums text-ink-900" dir="ltr">{sar(r.v)} SAR</span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 rounded-xl bg-night-900 px-4 py-4 text-white">
            <span className="font-semibold">{t("cost.total")}</span>
            <span className="text-xl font-semibold tabular-nums" dir="ltr">{sar(total)} SAR</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-400">{t("cost.note")}</p>
      </div>
    );
  }

  // report
  return (
    <div className="grid items-center gap-6 sm:grid-cols-[1fr_200px]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">{t("report.kicker")}</p>
        <h4 className="mt-1 text-2xl font-semibold text-ink-900">{t("report.title", { district: nm(malqa) })}</h4>
        <ul className="mt-5 space-y-2.5 text-sm text-ink-700">
          {(t.raw("report.items") as string[]).map((it) => (
            <li key={it} className="flex items-center gap-2.5"><IconCheck width={16} height={16} className="shrink-0 text-green-600" /> {it}</li>
          ))}
        </ul>
        <span className="mt-6 inline-flex items-center gap-2 rounded-xl bg-night-900 px-4 py-2.5 text-sm font-semibold text-white"><IconDoc width={16} height={16} /> {t("report.cta")}</span>
      </div>
      <div className="mx-auto w-44 rotate-2 rounded-lg border border-sand-200 bg-white p-4 shadow-xl sm:w-full">
        <div className="flex items-center gap-1.5"><LogoMark className="h-5 w-5" /><span className="text-[10px] font-bold text-ink-900">Miftah AI</span></div>
        <div className="mt-3 h-2 w-3/4 rounded bg-ink-900/80" />
        <div className="mt-1.5 h-1.5 w-1/2 rounded bg-ink-200" />
        <Sparkline id="tour-report" values={malqa.trend} stroke="#006c35" className="mt-4 h-10 w-full" />
        {[0, 1, 2, 3].map((i) => <div key={i} className="mt-2 h-1.5 rounded bg-sand-200" style={{ width: `${90 - i * 12}%` }} />)}
        <div className="mt-4 h-6 rounded bg-green-50" />
      </div>
    </div>
  );
}
