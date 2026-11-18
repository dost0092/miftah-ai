import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero, SectionHeading } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { CTASection } from "@/components/CTASection";
import { LogoMark } from "@/components/Logo";
import { IconGlobe, IconShield, IconSpark, IconCheck } from "@/components/Icons";
import { pageMetadata } from "@/lib/site";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return pageMetadata({ locale, path: "/about", title: t("eyebrow"), description: t("mission") });
}

const valueIcons = [IconCheck, IconGlobe, IconShield, IconSpark];

export default async function AboutPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const values = t.raw("values") as Array<{ title: string; body: string }>;

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} />

      <section className="container-x grid items-center gap-14 py-24 lg:grid-cols-[1.4fr_1fr]">
        <Reveal>
          <p className="font-display text-2xl leading-relaxed text-ink-900 sm:text-3xl sm:leading-snug">{t("story")}</p>
        </Reveal>
        <Reveal delay={120} className="relative mx-auto grid aspect-square w-full max-w-sm place-items-center overflow-hidden rounded-2xl bg-night-950">
          <div className="sadu-pattern absolute inset-0" />
          <div className="relative text-center">
            <LogoMark className="mx-auto h-24 w-24 animate-float" />
            <p className="mt-6 text-5xl font-bold text-white" lang="ar" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>مفتاح</p>
            <p className="mt-2 text-sm text-white/60">Miftah · &ldquo;key&rdquo;</p>
          </div>
        </Reveal>
      </section>

      <section className="bg-sand-100 py-24">
        <div className="container-x grid gap-5 md:grid-cols-2">
          <Reveal className="card p-8 sm:p-10">
            <p className="eyebrow"><span className="h-px w-6 bg-green-600" />{t("missionTitle")}</p>
            <p className="mt-5 text-2xl font-semibold leading-snug">{t("mission")}</p>
          </Reveal>
          <Reveal delay={100} className="rounded-[.875rem] bg-night-950 p-8 text-white sm:p-10">
            <p className="eyebrow !text-green-300">{t("visionTitle")}</p>
            <p className="mt-5 text-2xl font-semibold leading-snug">{t("vision")}</p>
          </Reveal>
        </div>
        <div className="container-x mt-5">
          <Reveal className="relative overflow-hidden rounded-[.875rem] border border-sand-200 bg-sand-50 p-8 sm:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <span className="font-display shrink-0 text-6xl text-green-600" dir="ltr">2030</span>
              <div>
                <h2 className="text-xl font-semibold">{t("vision2030Title")}</h2>
                <p className="mt-2 leading-relaxed text-ink-500">{t("vision2030")}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-x py-24">
        <SectionHeading eyebrow={t("eyebrow")} title={t("valuesTitle")} />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => {
            const Icon = valueIcons[i];
            return (
              <Reveal key={v.title} delay={i * 80} className="card p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-sand-100 text-ink-900 ring-1 ring-sand-200"><Icon width={20} height={20} /></span>
                <h3 className="mt-5 font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{v.body}</p>
              </Reveal>
            );
          })}
        </div>
      </section>
      <CTASection />
    </>
  );
}
