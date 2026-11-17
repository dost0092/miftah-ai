import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { DATA_UNTIL, QUARTERS, districts, getDistrict, trendChange } from "@/lib/districts";
import { cn, fmtDate, fmtNumber, fmtPercent } from "@/lib/format";
import { pageMetadata } from "@/lib/site";
import { SampleBanner } from "@/components/Section";
import { Sparkline, TrendChart } from "@/components/Sparkline";
import { ZoneBadge } from "@/components/ZoneBadge";
import { SaveDistrictButton } from "@/components/auth/AccountWidgets";
import { IconArrow, IconCalc, IconShield, IconSpark } from "@/components/Icons";

type Params = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => districts.map((d) => ({ locale, slug: d.slug })));
}

export async function generateMetadata({ params }: Params) {
  const { locale, slug } = await params;
  const d = getDistrict(slug);
  if (!d) return {};
  const t = await getTranslations({ locale, namespace: "district" });
  const c = await getTranslations({ locale, namespace: "common" });
  const name = locale === "ar" || locale === "ur" ? d.nameAr : d.nameEn;
  const city = c(`city.${d.city}`);
  return pageMetadata({
    locale,
    path: `/districts/${slug}`,
    title: `${name}, ${city} — ${t("titleSuffix")}`,
    description: t("subtitle", { name, city }),
  });
}

export default async function DistrictPage({ params }: Params) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const d = getDistrict(slug);
  if (!d) notFound();

  const t = await getTranslations("district");
  const c = await getTranslations("common");
  const rtl = locale === "ar" || locale === "ur";
  const name = rtl ? d.nameAr : d.nameEn;
  const alt = rtl ? d.nameEn : d.nameAr;
  const city = c(`city.${d.city}`);
  const change = trendChange(d);
  const nearby = districts.filter((x) => x.city === d.city && x.slug !== d.slug).slice(0, 4);

  return (
    <>
      <section className="relative overflow-hidden bg-hero text-white">
        <div className="sadu-pattern pointer-events-none absolute inset-0" />
        <div className="container-x relative py-16 sm:py-20">
          <Link href="/districts" className="inline-flex items-center gap-1.5 text-sm text-white/60 transition hover:text-white">
            <IconArrow width={14} height={14} className="rotate-180" /> {t("back")}
          </Link>
          <div className="mt-6 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="hero-in">
              <p className="text-sm font-semibold text-gold-300">{city}</p>
              <h1 className="font-display mt-2 text-5xl sm:text-6xl">{name}</h1>
              <p className="mt-2 text-xl text-white/50" lang={rtl ? "en" : "ar"}>{alt}</p>
              <p className="mt-5 max-w-xl text-white/70">{t("subtitle", { name, city })}</p>
              <div className="mt-6"><SaveDistrictButton slug={d.slug} /></div>
            </div>
            <div className="hero-in-delay grid grid-cols-3 gap-3 sm:min-w-[440px]">
              <HeroStat label={c("medianPrice")} value={fmtNumber(locale, d.median.apartment)} unit={c("perSqm")} />
              <HeroStat label={t("liquidity")} value={fmtNumber(locale, d.deals)} unit="Q3 2026" />
              <HeroStat label={c("trend12m")} value={fmtPercent(locale, change)} unit={c("type.apartment")} />
            </div>
          </div>
        </div>
        <div className="sadu-band opacity-70" />
      </section>

      <section className="container-x space-y-6 py-12">
        <SampleBanner text={c("sampleDataLong")} />
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{t("trendTitle")}</h2>
              <span className="text-xs text-ink-400">{c("dataUntil")} {fmtDate(locale, DATA_UNTIL)}</span>
            </div>
            <div className="mt-6">
              <TrendChart values={d.trend} labels={QUARTERS} locale={locale} label={t("trendTitle")} />
            </div>
            <p className="mt-4 text-xs text-ink-400">{c("source")}: Ministry of Justice (open data) · {c("sampleData")}</p>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center gap-2">
                <IconShield width={18} height={18} className="text-green-600" />
                <h2 className="font-semibold">{t("zoneTitle")}</h2>
              </div>
              <ZoneBadge status={d.zone} label={c(`zone.${d.zone}`)} className="mt-4" />
              <p className="mt-3 text-sm leading-relaxed text-ink-500">{t("zoneBody")}</p>
              <a href="https://rega.gov.sa/en" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:underline">
                REGA <IconArrow width={13} height={13} />
              </a>
            </div>
            <div className="card p-6">
              <h2 className="font-semibold">{t("byType")}</h2>
              <ul className="mt-4 divide-y divide-sand-100">
                {(["apartment", "villa", "land"] as const).map((k) => (
                  <li key={k} className="flex items-center justify-between py-3 text-sm">
                    <span className="text-ink-500">{c(`type.${k}`)}</span>
                    <span className="font-semibold tabular-nums" dir="ltr">{fmtNumber(locale, d.median[k])} <span className="text-ink-400">{c("perSqm")}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[1.5rem] bg-green-800 p-8 text-white sm:p-10">
          <div className="sadu-pattern pointer-events-none absolute inset-0" />
          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold-400 text-green-950"><IconSpark /></span>
              <div>
                <h2 className="text-xl font-semibold">{t("askTitle", { name })}</h2>
                <p className="mt-1 text-white/70">{t("askBody")}</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/waitlist" className="btn btn-gold">{t("askCta")} <IconArrow width={16} height={16} /></Link>
              <Link href="/calculator" className="btn btn-ghost-dark"><IconCalc width={16} height={16} /> {t("calcCta")}</Link>
            </div>
          </div>
        </div>

        <div className="pt-6">
          <h2 className="text-lg font-semibold">{t("nearby", { city })}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {nearby.map((n) => {
              const ch = trendChange(n);
              return (
                <Link key={n.slug} href={`/districts/${n.slug}`} className="card group p-5 transition hover:-translate-y-0.5">
                  <p className="font-semibold">{rtl ? n.nameAr : n.nameEn}</p>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="font-semibold tabular-nums" dir="ltr">{fmtNumber(locale, n.median.apartment)}</p>
                      <p className="text-xs text-ink-400">{c("perSqm")}</p>
                    </div>
                    <div className="text-end">
                      <Sparkline id={`nb-${n.slug}`} values={n.trend} className="h-7 w-20" />
                      <p className={cn("text-xs font-semibold", ch >= 0 ? "text-green-700" : "text-amber-700")} dir="ltr">{fmtPercent(locale, ch)}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

function HeroStat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="card-dark p-4">
      <p className="text-xs text-white/55">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums" dir="ltr">{value}</p>
      <p className="text-xs text-white/45">{unit}</p>
    </div>
  );
}
