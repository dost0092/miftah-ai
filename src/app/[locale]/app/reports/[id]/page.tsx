import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAppSession, displayName } from "@/lib/workspace/session";
import { getReport } from "@/lib/workspace/store";
import { getLibrary } from "@/lib/workspace/library";
import { DATA_UNTIL, IS_SAMPLE_DATA, QUARTERS, getDistrict, trendChange } from "@/lib/districts";
import { buyCosts } from "@/lib/costs";
import { fmtDate, fmtNumber, fmtPercent } from "@/lib/format";
import { Logo } from "@/components/Logo";
import { TrendChart } from "@/components/Sparkline";
import { ZoneBadge } from "@/components/ZoneBadge";
import { StatusBadge } from "@/components/app/ui";
import { PrintButton } from "@/components/app/PrintButton";
import { FactLabels, OfficialChecks } from "@/components/TrustKit";
import { officialSources } from "@/lib/official/sources";
import { KNOWLEDGE_AS_OF } from "@/lib/official/knowledge";
import { DISPOSAL_FEE_CITIES, FEES_CHECKED } from "@/lib/fees";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; id: string }> };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid border-t border-sand-200 pt-6">
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-green-700">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default async function ReportPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const session = (await getAppSession())!;
  const report = await getReport(session, id);
  if (!report) notFound();
  const d = report.district_slug ? getDistrict(report.district_slug) : null;
  if (!d) notFound();

  const t = await getTranslations("app.reports");
  const tc = await getTranslations("common");
  const ts = await getTranslations("app.advisor.status");
  const { docs } = await getLibrary();
  const doc = (docId: string) => docs.find((x) => x.id === docId);
  const cityName = tc(`city.${d.city}`);
  const change = trendChange(d);
  const propertyType = (report.params.propertyType as "apartment" | "villa" | "land") ?? "apartment";
  const area = typeof report.params.area === "number" ? report.params.area : propertyType === "land" ? 600 : propertyType === "villa" ? 350 : 120;
  const price = typeof report.params.price === "number" ? report.params.price : Math.round(d.median[propertyType] * area);
  const costs = buyCosts(price);
  const ruleIds =
    report.type === "cost"
      ? ["rett", "vat-real-estate", "brokerage-law"]
      : report.type === "due_diligence"
        ? ["non-saudi-ownership-law-2025", "saudi-properties-portal", "title-deeds-registry", "brokerage-law", "wafi-off-plan", "rett"]
        : ["non-saudi-ownership-law-2025", "non-saudi-executive-regulations-2026", "rett", "brokerage-law", "market-data-method"];
  const rules = ruleIds.map(doc).filter((x): x is NonNullable<typeof x> => Boolean(x));
  const steps = doc("buying-process-foreigner");
  const ref = `MFT-${report.id.slice(0, 8).toUpperCase()}`;
  const ruleSourceIds = new Set(["rega", "saudi-properties", ...rules.map((r) => r.sourceId), ...(report.type === "cost" ? ["zatca"] : ["moj-srem", "zatca"])]);
  const reportSources = officialSources.filter((o) => ruleSourceIds.has(o.id));
  const verifiedCount = rules.filter((r) => r.status === "verified").length;
  // A cost report for a price the user typed uses no sample market figures.
  const usesSample = IS_SAMPLE_DATA && !(report.type === "cost" && typeof report.params.price === "number");
  const checklist = [
    `Find the exact property on REGA's official zone map (saudiproperties.rega.gov.sa/zones) and confirm that ${d.nameEn} (${cityName}) is open to non-Saudi buyers. Current status in Miftah AI: ${tc(`zone.${d.zone}`)}.`,
    ...(steps?.paragraphs.slice(1).map((p) => p.replace(/^\d+\.\s*/, "")) ?? []),
    `Compare the asking price with the district median (SAR ${fmtNumber(locale, d.median.apartment)}/m² for apartments) and recent registered deals on the MOJ indicators.`,
  ];

  return (
    <div className="bg-sand-100/60 print:bg-white">
      <div className="no-print mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 pt-6 sm:px-6">
        <Link href="/app/reports" className="text-sm font-medium text-green-600 hover:text-green-700">← {t("back")}</Link>
        <PrintButton label={t("print")} />
      </div>

      <article className="mx-auto my-6 max-w-4xl space-y-6 bg-white px-6 py-8 shadow-frame sm:rounded-2xl sm:px-10 sm:py-10 print:my-0 print:max-w-none print:px-0 print:py-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <Logo />
          <div className="text-end text-xs text-ink-500">
            <p>{t("preparedFor")}: <span className="font-medium text-ink-900">{displayName(session)}</span></p>
            <p className="mt-0.5">{t("generatedOn")}: {fmtDate(locale, report.created_at)}</p>
            <p className="mt-0.5">{t("reference")}: <span className="font-mono font-medium text-ink-900" dir="ltr">{ref}</span></p>
            <p className="mt-0.5">{t("rulesReviewed")}: {fmtDate(locale, KNOWLEDGE_AS_OF)}</p>
          </div>
        </header>

        <div>
          <p className="text-sm font-medium text-green-700">{t(`type.${report.type}`)}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">{d.nameEn}, {cityName}</h1>
          <p className="mt-1 text-ink-500"><span dir="rtl">{d.nameAr}</span></p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ZoneBadge status={d.zone} label={`${tc("foreignZone")}: ${tc(`zone.${d.zone}`)}`} />
            {usesSample && <StatusBadge status="sample" label={tc("sampleData")} />}
            {!IS_SAMPLE_DATA && <StatusBadge status="verified" label={`${tc("dataUntil")} ${fmtDate(locale, DATA_UNTIL)}`} />}
          </div>
        </div>

        <div className="break-inside-avoid rounded-lg border border-sand-200 bg-sand-50 p-4">
          <p className="text-sm font-semibold text-ink-900">{t("howToRead")}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-600">
            {t("howToReadBody", { rules: rules.length, verified: verifiedCount })}
            {usesSample && <> {t("sampleWarning")}</>}
          </p>
          <FactLabels compact className="mt-3" />
        </div>

        {report.type !== "cost" && (
          <Section title={t("summary")}>
            <p className="text-sm leading-relaxed text-ink-700">
              {IS_SAMPLE_DATA ? <span className="font-semibold text-ink-900">[{tc("sampleData")}] </span> : null}
              {d.nameEn} ({cityName}): median apartment price SAR {fmtNumber(locale, d.median.apartment)}/m² in {QUARTERS[QUARTERS.length - 1]}, {fmtNumber(locale, d.deals)} {IS_SAMPLE_DATA ? "deals (example figure)" : "registered deals"} last quarter, {fmtPercent(locale, change)} over 12 months. Foreign ownership: {tc(`zoneHint.${d.zone}`)}.
            </p>
            {IS_SAMPLE_DATA && <p className="mt-2 text-xs leading-relaxed text-ink-400">{tc("sampleDataLong")}</p>}
          </Section>
        )}

        {report.type === "district" && (
          <Section title={t("prices")}>
            <div className="grid gap-6 sm:grid-cols-[1fr_1.4fr]">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-sand-200">
                  {(["apartment", "villa", "land"] as const).map((k) => (
                    <tr key={k}>
                      <td className="py-2 text-ink-600">{tc(`type.${k}`)}</td>
                      <td className="py-2 text-end font-medium tabular-nums text-ink-900" dir="ltr">{fmtNumber(locale, d.median[k])} {tc("perSqm")}</td>
                    </tr>
                  ))}
                  <tr><td className="py-2 text-ink-600">{tc("deals")}</td><td className="py-2 text-end tabular-nums text-ink-900" dir="ltr">{fmtNumber(locale, d.deals)}</td></tr>
                  <tr><td className="py-2 text-ink-600">{tc("trend12m")}</td><td className="py-2 text-end tabular-nums text-ink-900" dir="ltr">{fmtPercent(locale, change)}</td></tr>
                </tbody>
              </table>
              <TrendChart values={d.trend} labels={QUARTERS} locale={locale} label={tc("medianPrice")} />
            </div>
          </Section>
        )}

        {report.type === "cost" && (
          <Section title={t("costBreakdown")}>
            <p className="text-sm text-ink-500">
              {tc(`type.${propertyType}`)} · <span dir="ltr">{fmtNumber(locale, area)} m²</span>
              {typeof report.params.price !== "number" && <> · {tc("medianPrice")} <span dir="ltr">{fmtNumber(locale, d.median[propertyType])} {tc("perSqm")}</span></>}
            </p>
            <table className="mt-3 w-full text-sm">
              <tbody className="divide-y divide-sand-200">
                <tr><td className="py-2.5 text-ink-700">Price</td><td className="py-2.5 text-end font-medium tabular-nums" dir="ltr">SAR {fmtNumber(locale, price)}</td></tr>
                {costs.lines.map((l) => (
                  <tr key={l.id}>
                    <td className="py-2.5 text-ink-700">
                      {l.label} <span className="text-ink-400" dir="ltr">({+(l.rate * 100).toFixed(2)}%{l.base === "commission" ? " of commission" : ""})</span>
                      {l.note && <span className="block text-[11px] text-ink-400">{l.note}</span>}
                    </td>
                    <td className="py-2.5 text-end tabular-nums" dir="ltr">SAR {fmtNumber(locale, l.amount)}</td>
                  </tr>
                ))}
                <tr className="font-semibold"><td className="py-3">Estimated total</td><td className="py-3 text-end tabular-nums" dir="ltr">SAR {fmtNumber(locale, costs.total)}</td></tr>
              </tbody>
            </table>
            <p className="mt-3 rounded-lg border border-gold-500/30 bg-gold-100/50 p-3 text-xs leading-relaxed text-ink-700">
              When a non-Saudi owner later sells or otherwise disposes of this property in {DISPOSAL_FEE_CITIES.join(", ")}, REGA charges a fee of 2% of the value (Executive Regulations approved 23 June 2026), on top of the 5% transaction tax. On this price that would be about SAR {fmtNumber(locale, Math.round(price * 0.02))}. Fee rates last reviewed {fmtDate(locale, FEES_CHECKED)}.
            </p>
          </Section>
        )}

        {report.type === "due_diligence" && (
          <Section title={t("checklist")}>
            <ol className="space-y-2.5">
              {checklist.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink-700">
                  <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-ink-400" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </Section>
        )}

        <Section title={t("rules")}>
          <div className="space-y-3">
            {rules.map((r) => (
              <div key={r.id} className="break-inside-avoid rounded-xl border border-sand-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink-900">{r.title}</p>
                  <StatusBadge status={r.status} label={ts(r.status as "verified")} />
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{r.summary}</p>
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-400">
                  {r.effective && <span>{t("effective")}: {r.effective}</span>}
                  <span>{t("checkedOn")}: {r.checked ? fmtDate(locale, r.checked) : t("notYetChecked")}</span>
                </p>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-xs text-green-700 hover:underline" dir="ltr">{r.url}</a>
              </div>
            ))}
          </div>
        </Section>

        <Section title={t("sources")}>
          <ul className="space-y-1.5 text-xs text-ink-600">
            {reportSources.map((o) => (
              <li key={o.id} className="flex flex-wrap gap-x-2">
                <span className="font-medium text-ink-800">{o.name}</span>
                <a href={o.url} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline" dir="ltr">{o.url.replace(/^https?:\/\//, "")}</a>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t("checkYourself")}>
          <p className="mb-3 text-xs leading-relaxed text-ink-500">{t("checkYourselfBody")}</p>
          <OfficialChecks compact />
        </Section>

        <footer className="space-y-2 border-t border-sand-200 pt-5 text-[11px] leading-relaxed text-ink-400">
          <p>{t("disclaimer")}</p>
          <p>{t("independent")}</p>
          <p>{t("mistake", { ref })}</p>
        </footer>
      </article>
    </div>
  );
}
