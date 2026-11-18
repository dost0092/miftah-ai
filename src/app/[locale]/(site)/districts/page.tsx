import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero, SampleBanner } from "@/components/Section";
import { DistrictExplorer } from "@/components/DistrictExplorer";
import { ZoneBadge } from "@/components/ZoneBadge";
import { CTASection } from "@/components/CTASection";
import { DATA_UNTIL } from "@/lib/districts";
import { fmtDate } from "@/lib/format";
import { pageMetadata } from "@/lib/site";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "districts" });
  return pageMetadata({ locale, path: "/districts", title: t("title"), description: t("subtitle") });
}

export default async function DistrictsPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("districts");
  const c = await getTranslations("common");

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
      <section className="container-x space-y-6 py-16">
        <SampleBanner text={c("sampleDataLong")} />
        <DistrictExplorer />
        <div className="flex flex-col gap-4 rounded-2xl border border-sand-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink-700">{t("legend")}:</span>
            {(["yes", "conditional", "no", "unknown"] as const).map((z) => (
              <ZoneBadge key={z} status={z} label={c(`zone.${z}`)} />
            ))}
          </div>
          <p className="text-xs text-ink-400">
            {c("source")}: MOJ / REGA · {c("dataUntil")} {fmtDate(locale, DATA_UNTIL)}
          </p>
        </div>
      </section>
      <CTASection />
    </>
  );
}
