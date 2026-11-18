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
        ? ["non-saudi-ownership-law-2025", "title-deeds-registry", "brokerage-law", "wafi-off-plan", "rett"]
        : ["non-saudi-ownership-law-2025", "rett", "brokerage-law", "market-data-method"];
  const rules = ruleIds.map(doc).filter((x): x is NonNullable<typeof x> => Boolean(x));
  const steps = doc("buying-process-foreigner");
  const checklist = [
    `Confirm with REGA that ${d.nameEn} (${cityName}) is inside a zone open to non-Saudi buyers. Current status in Miftah AI: ${tc(`zone.${d.zone}`)}.`,
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
            <p className="mt-0.5 font-mono text-[10px] text-ink-400" dir="ltr">{report.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </header>

        <div>
          <p className="text-sm font-medium text-green-700">{t(`type.${report.type}`)}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">{d.nameEn}, {cityName}</h1>
          <p className="mt-1 text-ink-500"><span dir="rtl">{d.nameAr}</span></p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ZoneBadge status={d.zone} label={`${tc("foreignZone")}: ${tc(`zone.${d.zone}`)}`} />
            {IS_SAMPLE_DATA && <StatusBadge status="sample" label={tc("sampleData")} />}
            <StatusBadge status="verified" label={`${tc("dataUntil")} ${fmtDate(locale, DATA_UNTIL)}`} />
          </div>
        </div>

        {report.type !== "cost" && (
          <Section title={t("summary")}>
            <p className="text-sm leading-relaxed text-ink-700">
              {d.nameEn} ({cityName}): median apartment price SAR {fmtNumber(locale, d.median.apartment)}/m² in {QUARTERS[QUARTERS.length - 1]}, {fmtNumber(locale, d.deals)} registered deals last quarter, {fmtPercent(locale, change)} over 12 months. Foreign ownership: {tc(`zoneHint.${d.zone}`)}.
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
            <p className="mt-2 text-xs text-ink-500">A transaction fee for non-Saudi buyers may also apply under the 2025 ownership law; confirm the current rate with REGA.</p>
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
                <p className="mt-1.5 truncate text-xs text-green-700" dir="ltr">{r.url}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title={t("sources")}>
          <ul className="list-disc space-y-1 ps-5 text-xs text-ink-600" dir="ltr">
            <li>Ministry of Justice, registered real estate transactions: srem.moj.gov.sa</li>
            <li>Real Estate General Authority (REGA): rega.gov.sa, rei.rega.gov.sa</li>
            <li>Zakat, Tax and Customs Authority (ZATCA): zatca.gov.sa</li>
          </ul>
        </Section>

        <footer className="border-t border-sand-200 pt-5 text-[11px] leading-relaxed text-ink-400">{t("disclaimer")}</footer>
      </article>
    </div>
  );
}
