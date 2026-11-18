"use client";

import "leaflet/dist/leaflet.css";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { Link } from "@/i18n/navigation";
import type { District } from "@/lib/districts";
import { buyCosts } from "@/lib/costs";
import { cn, fmtDate, fmtNumber, fmtPercent } from "@/lib/format";
import { TrendChart } from "@/components/Sparkline";
import { ZoneBadge } from "@/components/ZoneBadge";
import { StatusBadge } from "./ui";
import { IconChat, IconCheck, IconExternal, IconLayers, IconPin, IconReport, IconX } from "@/components/Icons";

type City = "riyadh" | "jeddah";
type Rule = { id: string; title: string; summary: string; url: string; status: string };
type Props = { districts: District[]; quarters: string[]; dataUntil: string; isSample: boolean; rules: Rule[]; initial: string | null };

const CITY_VIEW: Record<City, { center: [number, number]; zoom: number }> = {
  riyadh: { center: [24.79, 46.66], zoom: 11 },
  jeddah: { center: [21.62, 39.14], zoom: 11 },
};
const SCALE = ["#dbe4ff", "#a9bdf8", "#7290f2", "#4166ea", "#1f3fb0"];
const ZONE_COLOR = { yes: "#10b981", no: "#ef4444", conditional: "#f59e0b", unknown: "#8b919b" } as const;
const AREA = 120;

function logView(d: District) {
  fetch("/api/app/activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "map_view", title: `${d.nameEn}, ${d.city === "riyadh" ? "Riyadh" : "Jeddah"}`, href: `/app/map?d=${d.slug}` }),
  }).catch(() => {});
}

export function MarketMap({ districts, quarters, dataUntil, isSample, rules, initial }: Props) {
  const t = useTranslations("app.map");
  const tc = useTranslations("common");
  const ts = useTranslations("app.advisor.status");
  const locale = useLocale();
  const rtl = locale === "ar" || locale === "ur";
  const first = districts.find((d) => d.slug === initial) ?? null;
  const [city, setCity] = useState<City>(first?.city ?? "riyadh");
  const [colorBy, setColorBy] = useState<"price" | "zone">("price");
  const [selected, setSelected] = useState<District | null>(first);
  const [tab, setTab] = useState<"overview" | "ownership" | "costs" | "sources">("overview");
  const mapEl = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const layer = useRef<Leaflet.LayerGroup | null>(null);
  const L = useRef<typeof Leaflet | null>(null);
  const [ready, setReady] = useState(false);

  const inCity = useMemo(() => districts.filter((d) => d.city === city), [districts, city]);
  const breaks = useMemo(() => {
    const v = inCity.map((d) => d.median.apartment).sort((a, b) => a - b);
    return [0.2, 0.4, 0.6, 0.8].map((q) => v[Math.min(v.length - 1, Math.floor(q * v.length))]);
  }, [inCity]);
  const colorFor = (d: District) => (colorBy === "zone" ? ZONE_COLOR[d.zone] : SCALE[breaks.filter((b) => d.median.apartment >= b).length]);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((mod) => {
      if (cancelled || !mapEl.current || map.current) return;
      L.current = mod;
      const view = CITY_VIEW[first?.city ?? "riyadh"];
      const m = mod.map(mapEl.current, { zoomControl: false, attributionControl: true }).setView(first ? first.center : view.center, first ? 12 : view.zoom);
      // Any XYZ tile service can be plugged in with NEXT_PUBLIC_MAP_TILES (e.g. a paid provider for production traffic).
      mod.tileLayer(process.env.NEXT_PUBLIC_MAP_TILES || "https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        className: "map-tiles",
      }).addTo(m);
      mod.control.zoom({ position: rtl ? "bottomleft" : "bottomright" }).addTo(m);
      layer.current = mod.layerGroup().addTo(m);
      map.current = m;
      setReady(true);
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draw districts whenever the city, colouring or selection changes.
  useEffect(() => {
    const mod = L.current;
    if (!ready || !mod || !layer.current) return;
    layer.current.clearLayers();
    for (const d of inCity) {
      const active = selected?.slug === d.slug;
      const circle = mod.circle(d.center, {
        radius: 1150,
        color: active ? "#0a0b0d" : "#ffffff",
        weight: active ? 3 : 1.5,
        fillColor: colorFor(d),
        fillOpacity: active ? 0.85 : 0.65,
      });
      circle.bindTooltip(rtl ? d.nameAr : d.nameEn, { permanent: true, direction: "center", className: "district-label" });
      circle.on("click", () => {
        setSelected(d);
        setTab("overview");
        logView(d);
      });
      circle.addTo(layer.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, inCity, colorBy, selected, breaks, rtl]);

  const loggedFirst = useRef(false);
  useEffect(() => {
    if (first && !loggedFirst.current) logView(first);
    loggedFirst.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function switchCity(c: City) {
    setCity(c);
    setSelected(null);
    map.current?.flyTo(CITY_VIEW[c].center, CITY_VIEW[c].zoom, { duration: 0.8 });
  }

  useEffect(() => {
    if (selected && map.current) map.current.flyTo(selected.center, Math.max(map.current.getZoom(), 12), { duration: 0.6 });
    // Leaflet needs to know the container changed size when the panel opens or closes.
    const id = setTimeout(() => map.current?.invalidateSize(), 250);
    return () => clearTimeout(id);
  }, [selected]);

  const d = selected;
  const change = d ? (d.trend[d.trend.length - 1] - d.trend[d.trend.length - 5]) / d.trend[d.trend.length - 5] : 0;
  const costs = d ? buyCosts(d.median.apartment * AREA) : null;
  const ownershipRules = rules.filter((r) => ["non-saudi-ownership-law-2025", "premium-residency-property", "buying-process-foreigner"].includes(r.id));

  return (
    <div className="relative flex h-full min-h-[560px] flex-col lg:flex-row">
      {/* Map */}
      <div className="relative min-h-[360px] flex-1">
        <div ref={mapEl} className="absolute inset-0 z-0" />

        {/* Controls */}
        <div className="pointer-events-none absolute inset-x-3 top-3 z-[500] flex flex-wrap items-start gap-2">
          <div className="pointer-events-auto flex rounded-xl bg-white p-1 shadow-frame">
            {(["riyadh", "jeddah"] as City[]).map((c) => (
              <button key={c} type="button" onClick={() => switchCity(c)} className={cn("rounded-lg px-3.5 py-1.5 text-sm font-medium transition", city === c ? "bg-night-950 text-white" : "text-ink-700 hover:bg-sand-100")}>
                {t(`city.${c}`)}
              </button>
            ))}
          </div>
          <div className="pointer-events-auto flex items-center gap-1 rounded-xl bg-white p-1 shadow-frame">
            <IconLayers width={16} height={16} className="mx-1.5 text-ink-400" />
            {(["price", "zone"] as const).map((k) => (
              <button key={k} type="button" onClick={() => setColorBy(k)} className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition", colorBy === k ? "bg-green-50 text-green-700" : "text-ink-700 hover:bg-sand-100")}>
                {k === "price" ? t("byPrice") : t("byZone")}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-6 start-3 z-[500] max-w-[260px] rounded-xl bg-white/95 p-3 text-xs shadow-frame backdrop-blur">
          {colorBy === "price" ? (
            <>
              <p className="font-semibold text-ink-900">{t("legendPrice")}</p>
              <div className="mt-2 flex h-2 overflow-hidden rounded-full" dir="ltr">{SCALE.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}</div>
              <div className="mt-1 flex justify-between text-[11px] text-ink-500" dir="ltr">
                <span>{fmtNumber(locale, Math.min(...inCity.map((x) => x.median.apartment)))}</span>
                <span>{fmtNumber(locale, Math.max(...inCity.map((x) => x.median.apartment)))}</span>
              </div>
            </>
          ) : (
            <>
              <p className="font-semibold text-ink-900">{t("legendZone")}</p>
              <ul className="mt-2 space-y-1">
                {(Object.keys(ZONE_COLOR) as (keyof typeof ZONE_COLOR)[]).map((z) => (
                  <li key={z} className="flex items-center gap-2 text-ink-700"><span className="h-2.5 w-2.5 rounded-full" style={{ background: ZONE_COLOR[z] }} /> {tc(`zone.${z}`)}</li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-2 hidden leading-snug text-[10.5px] text-ink-400 sm:block">{t("approx")}</p>
        </div>
      </div>

      {/* Detail panel */}
      <aside className={cn("z-10 flex shrink-0 flex-col border-sand-200 bg-white lg:w-[440px] lg:border-s", d ? "max-h-[70vh] border-t lg:max-h-none lg:border-t-0" : "border-t lg:border-t-0")}>
        {!d ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 py-10 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-green-50 text-green-600"><IconPin width={22} height={22} /></span>
            <p className="mt-4 font-semibold text-ink-900">{t("pick")}</p>
            <p className="mt-1 max-w-xs text-sm leading-relaxed text-ink-500">{t("pickBody")}</p>
            <div className="mt-6 flex max-h-64 w-full flex-col gap-1 overflow-y-auto text-start">
              {inCity
                .slice()
                .sort((a, b) => b.deals - a.deals)
                .map((x) => (
                  <button key={x.slug} type="button" onClick={() => { setSelected(x); logView(x); }} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-sand-50">
                    <span className="flex items-center gap-2.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: colorFor(x) }} />{rtl ? x.nameAr : x.nameEn}</span>
                    <span className="tabular-nums text-ink-500" dir="ltr">{fmtNumber(locale, x.median.apartment)}</span>
                  </button>
                ))}
            </div>
          </div>
        ) : (
          <>
            <div className="border-b border-sand-200 px-5 pb-4 pt-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-semibold tracking-tight text-green-700">{rtl ? d.nameAr : d.nameEn}</h1>
                  <p className="mt-0.5 text-sm text-ink-500">{rtl ? d.nameEn : d.nameAr} · {tc(`city.${d.city}`)}</p>
                </div>
                <button type="button" onClick={() => setSelected(null)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sand-100 text-ink-500 hover:bg-sand-200" aria-label={t("close")}>
                  <IconX width={16} height={16} />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <ZoneBadge status={d.zone} label={tc(`zone.${d.zone}`)} />
                {isSample ? <StatusBadge status="sample" label={tc("sampleData")} /> : null}
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  <IconCheck width={12} height={12} /> {tc("dataUntil")} {fmtDate(locale, dataUntil)}
                </span>
              </div>
            </div>

            <div className="flex gap-1 border-b border-sand-200 px-3">
              {(["overview", "ownership", "costs", "sources"] as const).map((k) => (
                <button key={k} type="button" onClick={() => setTab(k)} className={cn("-mb-px border-b-2 px-3 py-3 text-sm font-medium transition", tab === k ? "border-green-600 text-green-700" : "border-transparent text-ink-500 hover:text-ink-900")}>
                  {t(`tabs.${k}`)}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {tab === "overview" && (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-medium text-ink-500">{t("medianByType")}</p>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {(["apartment", "villa", "land"] as const).map((k) => (
                        <div key={k} className="rounded-xl border border-sand-200 p-3">
                          <p className="text-[11px] text-ink-500">{tc(`type.${k}`)}</p>
                          <p className="mt-1 text-lg font-semibold tabular-nums text-ink-900" dir="ltr">{fmtNumber(locale, d.median[k])}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-sand-50 p-3"><p className="text-[11px] text-ink-500">{t("deals")}</p><p className="mt-1 text-lg font-semibold text-ink-900" dir="ltr">{fmtNumber(locale, d.deals)}</p></div>
                    <div className="rounded-xl bg-sand-50 p-3"><p className="text-[11px] text-ink-500">{t("change")}</p><p className={cn("mt-1 text-lg font-semibold", change >= 0 ? "text-emerald-700" : "text-amber-700")} dir="ltr">{fmtPercent(locale, change)}</p></div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-ink-500">{t("trend")}</p>
                    <div className="mt-2 rounded-xl border border-sand-200 p-2"><TrendChart values={d.trend} labels={quarters} locale={locale} label={t("trend")} /></div>
                  </div>
                  {isSample && <p className="text-xs leading-relaxed text-amber-700">{tc("sampleDataLong")}</p>}
                </div>
              )}

              {tab === "ownership" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-sand-200 p-4">
                    <ZoneBadge status={d.zone} label={tc(`zone.${d.zone}`)} />
                    <p className="mt-3 text-sm leading-relaxed text-ink-700">{tc(`zoneHint.${d.zone}`)}</p>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500">{t("ownershipBody")}</p>
                  </div>
                  <p className="text-xs font-medium text-ink-500">{t("relatedRules")}</p>
                  {ownershipRules.map((r) => (
                    <Link key={r.id} href={`/app/library?doc=${r.id}#${r.id}`} className="block rounded-xl border border-sand-200 p-4 transition hover:border-green-300">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-ink-900">{r.title}</span>
                        <StatusBadge status={r.status} label={ts(r.status as "verified")} />
                      </span>
                      <span className="mt-1.5 block text-sm leading-relaxed text-ink-500">{r.summary}</span>
                    </Link>
                  ))}
                </div>
              )}

              {tab === "costs" && costs && (
                <div>
                  <p className="text-sm text-ink-500">{t("costsFor", { area: AREA })}</p>
                  <table className="mt-3 w-full text-sm">
                    <tbody className="divide-y divide-sand-200">
                      <tr><td className="py-2.5 text-ink-700">{t("price")}</td><td className="py-2.5 text-end font-medium tabular-nums text-ink-900" dir="ltr">SAR {fmtNumber(locale, d.median.apartment * AREA)}</td></tr>
                      {costs.lines.map((l) => (
                        <tr key={l.id}>
                          <td className="py-2.5 text-ink-700">
                            <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-green-700">{l.label} <IconExternal width={12} height={12} className="text-ink-400" /></a>
                            {l.note && <span className="block text-[11px] text-ink-400">{l.note}</span>}
                          </td>
                          <td className="py-2.5 text-end tabular-nums text-ink-900" dir="ltr">SAR {fmtNumber(locale, l.amount)}</td>
                        </tr>
                      ))}
                      <tr className="font-semibold"><td className="py-3 text-ink-900">{t("total")}</td><td className="py-3 text-end tabular-nums text-ink-900" dir="ltr">SAR {fmtNumber(locale, costs.total)}</td></tr>
                    </tbody>
                  </table>
                  <Link href="/app/calculator" className="mt-3 inline-flex text-sm font-medium text-green-600 hover:text-green-700">{tc("learnMore")}</Link>
                </div>
              )}

              {tab === "sources" && (
                <ul className="space-y-2 text-sm">
                  {[
                    { name: "Ministry of Justice: registered transactions", url: "https://srem.moj.gov.sa" },
                    { name: "REGA Real Estate Indicators", url: "https://rei.rega.gov.sa/en" },
                    { name: "REGA: non-Saudi ownership zones", url: "https://rega.gov.sa/en" },
                    { name: "ZATCA: Real Estate Transaction Tax", url: "https://zatca.gov.sa/en/RulesRegulations/Taxes/Pages/Real-Estate-Transaction-Tax.aspx" },
                    { name: "OpenStreetMap (map base)", url: "https://www.openstreetmap.org" },
                  ].map((s) => (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 rounded-xl border border-sand-200 px-4 py-3 text-ink-800 transition hover:border-green-300">
                        {s.name} <IconExternal width={14} height={14} className="shrink-0 text-ink-400" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-sand-200 p-3">
              <Link href={`/app/advisor?q=${encodeURIComponent(`Tell me about buying an apartment in ${d.nameEn}, ${d.city === "riyadh" ? "Riyadh" : "Jeddah"}: prices, ownership rules and total costs.`)}`} className="btn btn-primary !px-2 !py-2.5 text-[13px]"><IconChat width={15} height={15} /> {t("askAi")}</Link>
              <Link href={`/app/reports/new?type=district&d=${d.slug}`} className="btn btn-ghost !px-2 !py-2.5 text-[13px]"><IconReport width={15} height={15} /> {t("brief")}</Link>
              <Link href={`/app/reports/new?type=due_diligence&d=${d.slug}`} className="btn btn-ghost !px-2 !py-2.5 text-[13px]"><IconCheck width={15} height={15} /> {t("checklist")}</Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
