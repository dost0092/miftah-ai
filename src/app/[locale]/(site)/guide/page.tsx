import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CTASection } from "@/components/CTASection";
import { FactLabels, OfficialChecks, ReviewedStamp } from "@/components/TrustKit";
import { KNOWLEDGE_AS_OF } from "@/lib/official/knowledge";
import { fmtDate } from "@/lib/format";
import { pageMetadata } from "@/lib/site";

type Params = { params: Promise<{ locale: string }> };
type GuideSection = { id: string; title: string; intro?: string; points: string[]; note?: string };

export async function generateMetadata({ params }: Params) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guide" });
  return pageMetadata({ locale, path: "/guide", title: t("title"), description: t("subtitle") });
}

export default async function GuidePage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("guide");
  const sections = t.raw("sections") as GuideSection[];
  const mistakes = t.raw("mistakes") as string[];
  const reviewed = fmtDate(locale, KNOWLEDGE_AS_OF);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: t("title"),
    description: t("subtitle"),
    dateModified: KNOWLEDGE_AS_OF,
    inLanguage: locale,
    publisher: { "@type": "Organization", name: "Miftah AI" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <section className="border-b border-sand-200 bg-sand-50">
        <div className="container-x py-14 sm:py-20">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="font-display mt-3 max-w-3xl text-3xl leading-tight text-ink-900 sm:text-5xl">{t("title")}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-600">{t("subtitle")}</p>
          <ReviewedStamp date={reviewed} className="mt-6" />
        </div>
        <div className="sadu-band" />
      </section>

      <div className="container-x grid gap-12 py-14 lg:grid-cols-[220px_1fr] lg:gap-16">
        {/* contents */}
        <nav aria-label={t("contents")} className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">{t("contents")}</p>
          <ol className="mt-3 space-y-2 text-sm">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="flex gap-2 text-ink-600 hover:text-green-700">
                  <span className="tabular-nums text-ink-400" dir="ltr">{i + 1}.</span> {s.title}
                </a>
              </li>
            ))}
            <li><a href="#mistakes" className="flex gap-2 text-ink-600 hover:text-green-700"><span className="tabular-nums text-ink-400" dir="ltr">{sections.length + 1}.</span> {t("mistakesTitle")}</a></li>
            <li><a href="#check" className="flex gap-2 text-ink-600 hover:text-green-700"><span className="tabular-nums text-ink-400" dir="ltr">{sections.length + 2}.</span> {t("checksTitle")}</a></li>
          </ol>
        </nav>

        <article className="min-w-0 max-w-3xl">
          <div className="rounded-lg border border-gold-500/30 bg-gold-100/50 p-4 text-sm leading-relaxed text-ink-700">{t("caution")}</div>

          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 border-b border-sand-200 py-10 last:border-0">
              <h2 className="text-2xl font-semibold text-ink-900">
                <span className="me-2 text-green-600" dir="ltr">{i + 1}.</span>
                {s.title}
              </h2>
              {s.intro && <p className="mt-3 leading-relaxed text-ink-600">{s.intro}</p>}
              <ul className="mt-5 space-y-3">
                {s.points.map((p, j) => (
                  <li key={j} className="flex gap-3 leading-relaxed text-ink-700">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-600" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              {s.note && <p className="mt-5 border-s-2 border-gold-500 ps-4 text-sm leading-relaxed text-ink-500">{s.note}</p>}
            </section>
          ))}

          <section id="mistakes" className="scroll-mt-24 border-b border-sand-200 py-10">
            <h2 className="text-2xl font-semibold text-ink-900">
              <span className="me-2 text-green-600" dir="ltr">{sections.length + 1}.</span>
              {t("mistakesTitle")}
            </h2>
            <ul className="mt-5 space-y-3">
              {mistakes.map((m, j) => (
                <li key={j} className="flex gap-3 leading-relaxed text-ink-700">
                  <span className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-ink-900 text-[10px] font-bold text-white">!</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </section>

          <section id="check" className="scroll-mt-24 py-10">
            <h2 className="text-2xl font-semibold text-ink-900">
              <span className="me-2 text-green-600" dir="ltr">{sections.length + 2}.</span>
              {t("checksTitle")}
            </h2>
            <p className="mt-3 leading-relaxed text-ink-600">{t("checksBody")}</p>
            <OfficialChecks className="mt-6" />
            <h3 className="mt-10 font-semibold text-ink-900">{t("labelsTitle")}</h3>
            <FactLabels compact className="mt-4" />
            <p className="mt-8 text-sm text-ink-500">
              {t("moreHelp")}{" "}
              <Link href="/calculator" className="font-semibold text-green-700 hover:underline">{t("calcLink")}</Link>
            </p>
          </section>
        </article>
      </div>
      <CTASection />
    </>
  );
}
