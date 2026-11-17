import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero, SectionHeading } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { CTASection } from "@/components/CTASection";
import { IconArrow, IconCheck, IconDatabase, IconFlag, IconLock, IconSearch, IconShield } from "@/components/Icons";
import { pageMetadata } from "@/lib/site";

type Params = { params: Promise<{ locale: string }> };
type Item = { title: string; body: string };

export async function generateMetadata({ params }: Params) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "trust" });
  return pageMetadata({ locale, path: "/trust", title: t("title"), description: t("subtitle") });
}

const qualityIcons = [IconCheck, IconSearch, IconFlag, IconLock];

export default async function TrustPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("trust");
  const rules = t.raw("rules") as string[];
  const sources = t.raw("sources") as Array<{ name: string; body: string; url: string }>;
  const pipeline = t.raw("pipeline") as Item[];
  const quality = t.raw("quality") as Item[];

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      {/* AI rules */}
      <section className="container-x grid gap-12 py-24 lg:grid-cols-[1fr_1.3fr]">
        <SectionHeading eyebrow={t("eyebrows.ai")} title={t("rulesTitle")} />
        <ol className="space-y-3">
          {rules.map((r, i) => (
            <Reveal key={i} delay={i * 60} className="card flex items-start gap-4 p-5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-green-600 font-semibold text-white" dir="ltr">{i + 1}</span>
              <p className="pt-1.5 leading-relaxed text-ink-700">{r}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Sources */}
      <section className="bg-sand-100 py-24">
        <div className="container-x">
          <SectionHeading eyebrow={t("eyebrows.data")} title={t("sourcesTitle")} />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sources.map((s, i) => (
              <Reveal key={s.name} delay={(i % 3) * 80}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="card group flex h-full flex-col p-6 transition hover:-translate-y-1">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-100 text-gold-700"><IconDatabase width={20} height={20} /></span>
                  <h3 className="mt-5 font-semibold">{s.name}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">{s.body}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-green-700" dir="ltr">
                    {new URL(s.url).hostname} <IconArrow width={13} height={13} />
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-8 flex items-start gap-3 rounded-2xl border border-green-600/20 bg-green-50 p-5 text-sm text-green-800">
            <IconShield width={18} height={18} className="mt-0.5 shrink-0" />
            <p>{t("noScrape")}</p>
          </Reveal>
        </div>
      </section>

      {/* Pipeline */}
      <section className="relative overflow-hidden bg-green-950 py-24 text-white">
        <div className="sadu-pattern pointer-events-none absolute inset-0 opacity-70" />
        <div className="container-x relative">
          <SectionHeading dark eyebrow={t("eyebrows.pipeline")} title={t("pipelineTitle")} />
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {pipeline.map((p, i) => (
              <Reveal key={i} delay={i * 80} className="card-dark relative p-5">
                <span className="text-xs font-semibold text-gold-300" dir="ltr">0{i + 1}</span>
                <h3 className="mt-3 font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{p.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Quality */}
      <section className="container-x py-24">
        <SectionHeading eyebrow={t("eyebrows.qa")} title={t("qualityTitle")} />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {quality.map((q, i) => {
            const Icon = qualityIcons[i];
            return (
              <Reveal key={i} delay={i * 80} className="card p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-green-50 text-green-600"><Icon width={20} height={20} /></span>
                <h3 className="mt-5 font-semibold">{q.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{q.body}</p>
              </Reveal>
            );
          })}
        </div>
      </section>
      <CTASection />
    </>
  );
}
