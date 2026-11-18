import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { CTASection } from "@/components/CTASection";
import { IconArrow, IconCode, IconDatabase, IconGlobe, IconLock } from "@/components/Icons";
import { pageMetadata } from "@/lib/site";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "developers" });
  return pageMetadata({ locale, path: "/developers", title: t("title"), description: t("subtitle") });
}

const sample = `curl https://api.miftahai.co/v1/districts/al-malqa/stats \\
  -H "Authorization: Bearer $MIFTAH_API_KEY"

{
  "district": { "slug": "al-malqa", "name_en": "Al Malqa", "name_ar": "الملقا", "city": "riyadh" },
  "foreign_zone": { "status": "unknown", "source_url": null, "checked_at": null },
  "stats": [
    { "quarter": "2026-Q3", "property_type": "apartment",
      "n_deals": 212, "median_ppsqm": 7400, "p25_ppsqm": 6300, "p75_ppsqm": 8600 }
  ],
  "source": "MOJ open data",
  "data_until": "2026-09-30"
}`;

const icons = [IconGlobe, IconDatabase, IconLock];

export default async function DevelopersPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("developers");
  const endpoints = t.raw("endpoints") as Array<{ method: string; path: string; desc: string }>;
  const features = t.raw("features") as Array<{ title: string; body: string }>;

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")}>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link href="/contact" className="btn btn-primary">{t("cta")} <IconArrow width={16} height={16} /></Link>
          <span className="rounded-full border border-sand-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-500">{t("badge")}</span>
        </div>
      </PageHero>

      <section className="container-x grid gap-10 py-20 lg:grid-cols-2">
        <Reveal>
          <h2 className="text-xl font-semibold">{t("endpointsTitle")}</h2>
          <ul className="mt-6 space-y-3">
            {endpoints.map((e) => (
              <li key={e.path} className="card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
                <span className="flex items-center gap-3" dir="ltr">
                  <span className={e.method === "GET" ? "rounded-md bg-green-50 px-2 py-0.5 font-mono text-xs font-bold text-green-700" : "rounded-md bg-sand-100 px-2 py-0.5 font-mono text-xs font-bold text-ink-700"}>{e.method}</span>
                  <code className="font-mono text-sm font-semibold text-ink-900">{e.path}</code>
                </span>
                <span className="text-sm text-ink-500 sm:ms-auto sm:text-end">{e.desc}</span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={120}>
          <div className="overflow-hidden shadow-frame rounded-[.875rem] bg-night-950 text-white" dir="ltr">
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3 text-xs text-white/50">
              <IconCode width={14} height={14} className="text-green-400" /> GET /v1/districts/al-malqa/stats
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-6 text-green-100/90">{sample}</pre>
          </div>
        </Reveal>
      </section>

      <section className="container-x grid gap-5 pb-8 md:grid-cols-3">
        {features.map((f, i) => {
          const Icon = icons[i];
          return (
            <Reveal key={f.title} delay={i * 80} className="card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-sand-100 text-ink-900 ring-1 ring-sand-200"><Icon width={20} height={20} /></span>
              <h3 className="mt-5 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{f.body}</p>
            </Reveal>
          );
        })}
      </section>
      <CTASection />
    </>
  );
}
