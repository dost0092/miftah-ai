"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/format";
import { UpgradeNotice } from "./billing";
import type { ReportType } from "@/lib/workspace/store";
import { IconCalc, IconCheck, IconReport } from "@/components/Icons";

type Opt = { slug: string; nameEn: string; nameAr: string; city: string };
const TYPES: { k: ReportType; Icon: typeof IconReport }[] = [
  { k: "district", Icon: IconReport },
  { k: "due_diligence", Icon: IconCheck },
  { k: "cost", Icon: IconCalc },
];

export function NewReportForm({ districts, initialType, initialDistrict }: { districts: Opt[]; initialType: ReportType; initialDistrict: string }) {
  const t = useTranslations("app.reports");
  const tc = useTranslations("common");
  const locale = useLocale();
  const rtl = locale === "ar" || locale === "ur";
  const router = useRouter();
  const [type, setType] = useState<ReportType>(initialType);
  const [district, setDistrict] = useState(initialDistrict);
  const [propertyType, setPropertyType] = useState<"apartment" | "villa" | "land">("apartment");
  const [price, setPrice] = useState("");
  const [area, setArea] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [limit, setLimit] = useState<number | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const num = (s: string) => (s.trim() ? Number(s.replace(/[^\d.]/g, "")) || undefined : undefined);
    const res = await fetch("/api/app/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, district, propertyType, price: num(price), area: num(area) }),
    }).catch(() => null);
    if (res?.status === 402) {
      const d = await res.json().catch(() => ({}));
      setLimit(d.limit ?? 1);
      setBusy(false);
      return;
    }
    const data = res?.ok ? await res.json() : null;
    if (data?.id) router.push(`/app/reports/${data.id}`);
    else {
      setError(true);
      setBusy(false);
    }
  }

  const cities = ["riyadh", "jeddah"] as const;
  return (
    <form onSubmit={submit} className="space-y-6">
      <fieldset>
        <legend className="text-sm font-semibold text-ink-900">{t("chooseType")}</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {TYPES.map(({ k, Icon }) => (
            <label key={k} className={cn("relative cursor-pointer rounded-2xl border bg-white p-4 transition", type === k ? "border-green-600 ring-2 ring-green-100" : "border-sand-200 hover:border-sand-300")}>
              <input type="radio" name="type" value={k} checked={type === k} onChange={() => setType(k)} className="sr-only" />
              <span className={cn("grid h-9 w-9 place-items-center rounded-xl", type === k ? "bg-green-600 text-white" : "bg-sand-100 text-ink-500")}><Icon width={18} height={18} /></span>
              <span className="mt-3 block text-sm font-semibold text-ink-900">{t(`type.${k}`)}</span>
              <span className="mt-1 block text-xs leading-relaxed text-ink-500">{t(`typeBody.${k}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-ink-700">{t("district")}</span>
          <select value={district} onChange={(e) => setDistrict(e.target.value)} className="input mt-2">
            {cities.map((c) => (
              <optgroup key={c} label={tc(`city.${c}`)}>
                {districts.filter((d) => d.city === c).map((d) => <option key={d.slug} value={d.slug}>{rtl ? d.nameAr : d.nameEn}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink-700">{t("propertyType")}</span>
          <select value={propertyType} onChange={(e) => setPropertyType(e.target.value as typeof propertyType)} className="input mt-2">
            {(["apartment", "villa", "land"] as const).map((k) => <option key={k} value={k}>{tc(`type.${k}`)}</option>)}
          </select>
        </label>
        {type === "cost" && (
          <>
            <label className="block">
              <span className="text-sm font-semibold text-ink-700">{t("priceOptional")}</span>
              <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1,500,000" className="input mt-2" dir="ltr" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ink-700">{t("areaOptional")}</span>
              <input inputMode="numeric" value={area} onChange={(e) => setArea(e.target.value)} placeholder="120" className="input mt-2" dir="ltr" />
            </label>
          </>
        )}
      </div>

      {limit !== null && <UpgradeNotice kind="report" limit={limit} />}
      {error && <p className="rounded-xl border border-sand-200 bg-sand-50 px-4 py-3 text-sm text-ink-700">{t("error")}</p>}
      <button type="submit" disabled={busy} className="btn btn-primary">{busy ? t("generating") : t("generate")}</button>
    </form>
  );
}
