import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Link } from "@/i18n/navigation";
import { ChatDemo } from "@/components/ChatDemo";
import { HeroAsk } from "@/components/HeroAsk";
import { DistrictExplorer } from "@/components/DistrictExplorer";
import { CTASection } from "@/components/CTASection";
import { FAQ } from "@/components/FAQ";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/Section";
import { ProductTour } from "@/components/ProductTour";
import {
  IconArrow, IconBriefcase, IconBuilding, IconCalc, IconChat, IconCheck, IconDatabase, IconDoc, IconGlobe,
  IconMap, IconPlane, IconSearch, IconShield, IconSpark, IconTag, IconUser,
} from "@/components/Icons";
import { localeNames, type Locale } from "@/i18n/routing";

const featureIcons = [IconChat, IconShield, IconMap, IconCalc, IconTag, IconDoc];
const stepIcons = [IconGlobe, IconSpark, IconDatabase, IconCheck];
const personaIcons = [IconUser, IconPlane, IconBriefcase, IconBuilding];

const languageSamples: Array<{ locale: Locale; text: string }> = [
  { locale: "en", text: "Can I buy property in Riyadh?" },
  { locale: "ar", text: "هل يمكنني شراء عقار في الرياض؟" },
  { locale: "ur", text: "کیا میں ریاض میں جائیداد خرید سکتا ہوں؟" },
  { locale: "hi", text: "क्या मैं रियाद में संपत्ति खरीद सकता हूँ?" },
  { locale: "zh", text: "我可以在利雅得买房吗？" },
];

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("home");
  const td = useTranslations("districts");
  const tc = useTranslations("common");

  type Item = { title: string; body: string };
  const problems = t.raw("problem.items") as Item[];
  const steps = t.raw("how.steps") as Item[];
  const tt = useTranslations("tour");
  const features = t.raw("features.items") as Item[];
  const points = t.raw("principle.points") as string[];
  const personas = t.raw("personas.items") as Item[];
  const stats = t.raw("stats.items") as Array<{ value: string; label: string }>;
  const sources = t.raw("sources.items") as string[];
  const faq = t.raw("faq.items") as Array<{ q: string; a: string }>;

  return (
    <>
      {/* ───────────── HERO ───────────── */}
      <section className="relative overflow-hidden bg-canvas">
        <div className="grid-lines pointer-events-none absolute inset-0" />
        <div className="container-x relative pb-20 pt-16 sm:pt-24 lg:pb-28">
          <div className="hero-in mx-auto max-w-3xl text-center">
            <Link href="/trust" className="inline-flex items-center gap-2 rounded-full border border-sand-200 bg-white py-1 pe-3 ps-1 text-[13px] text-ink-700 shadow-sm transition hover:border-sand-300">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-green-50 text-green-600 ring-1 ring-inset ring-green-600/15"><IconShield width={13} height={13} /></span>
              {t("hero.trustNote")}
              <IconArrow width={13} height={13} className="flip-rtl text-ink-400" />
            </Link>
            <h1 className="font-display mx-auto mt-7 max-w-[18ch] text-[2.6rem] leading-[1.04] text-ink-900 sm:text-6xl lg:text-[4.5rem]">
              {t("hero.titleA")} <span className="text-green-600">{t("hero.titleHighlight")}</span> {t("hero.titleB")}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-500 sm:text-xl">{t("hero.subtitle")}</p>
            <div className="mx-auto mt-9 flex max-w-xl justify-center">
              <HeroAsk />
            </div>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/waitlist" className="btn btn-primary">
                {t("hero.ctaPrimary")}
                <IconArrow width={16} height={16} className="flip-rtl" />
              </Link>
              <Link href="/districts" className="btn btn-ghost">
                <IconSearch width={16} height={16} />
                {t("hero.ctaSecondary")}
              </Link>
            </div>
          </div>
          <div className="hero-in-delay mx-auto mt-16 max-w-4xl sm:mt-20">
            <ChatDemo />
          </div>
        </div>
      </section>

      {/* ───────────── SOURCES STRIP ───────────── */}
      <section className="border-y border-sand-200 bg-white py-10">
        <div className="container-x">
          <p className="text-center text-sm text-ink-400">{t("sources.title")}</p>
          <div className="relative mt-6 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]" dir="ltr">
            <div className="flex w-max animate-marquee gap-14">
              {[...sources, ...sources].map((s, i) => (
                <span key={i} className="flex items-center gap-2.5 whitespace-nowrap text-base font-semibold text-ink-400">
                  <IconDatabase width={17} height={17} className="text-sand-300" />
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── PROBLEM ───────────── */}
      <section className="container-x py-24 sm:py-32">
        <SectionHeading eyebrow={t("problem.eyebrow")} title={t("problem.title")} subtitle={t("problem.subtitle")} />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {problems.map((p, i) => (
            <Reveal key={i} delay={i * 100} className="card group relative overflow-hidden p-7">
              <span className="text-sm font-semibold text-ink-400" dir="ltr">0{i + 1}</span>
              <h3 className="mt-4 text-xl font-semibold text-ink-900">{p.title}</h3>
              <p className="mt-3 leading-relaxed text-ink-500">{p.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────────── HOW IT WORKS ───────────── */}
      <section className="relative border-y border-sand-200 bg-sand-50 py-24 sm:py-32">
        <div className="container-x">
          <SectionHeading center eyebrow={t("how.eyebrow")} title={t("how.title")} subtitle={t("how.subtitle")} />
          <div className="relative mt-16 grid gap-6 md:grid-cols-4">
            <div className="absolute inset-x-[12%] top-8 hidden h-px bg-sand-300 md:block" />
            {steps.map((s, i) => {
              const Icon = stepIcons[i];
              return (
                <Reveal key={i} delay={i * 120} className="relative text-center">
                  <span className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-sand-200 bg-white text-ink-900 shadow-sm">
                    <Icon width={26} height={26} />
                    <span className="absolute -end-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-night-950 text-xs font-semibold text-white">{i + 1}</span>
                  </span>
                  <h3 className="mt-6 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.body}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────── PRODUCT TOUR ───────────── */}
      <section id="demo" className="container-x scroll-mt-24 py-24 sm:py-32">
        <SectionHeading eyebrow={tt("section.eyebrow")} title={tt("section.title")} subtitle={tt("section.subtitle")} />
        <div className="mt-14">
          <ProductTour />
        </div>
      </section>

      {/* ───────────── FEATURES ───────────── */}
      <section className="container-x py-24 sm:py-32">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading eyebrow={t("features.eyebrow")} title={t("features.title")} subtitle={t("features.subtitle")} />
          <Reveal>
            <Link href="/product" className="btn btn-ghost">
              {t("features.eyebrow")}
              <IconArrow width={16} height={16} />
            </Link>
          </Reveal>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = featureIcons[i];
            const highlight = i === 0;
            return (
              <Reveal
                key={i}
                delay={(i % 3) * 100}
                className={highlight ? "relative overflow-hidden rounded-[.875rem] bg-night-950 p-7 text-white" : "card p-7 transition hover:border-sand-300 hover:shadow-md"}
              >
                {highlight && <div className="sadu-pattern pointer-events-none absolute inset-0" />}
                <span className={highlight ? "relative grid h-12 w-12 place-items-center rounded-xl bg-white/10 text-white ring-1 ring-white/15" : "grid h-12 w-12 place-items-center rounded-xl bg-sand-100 text-ink-900 ring-1 ring-sand-200"}>
                  <Icon width={22} height={22} />
                </span>
                <h3 className="relative mt-6 text-lg font-semibold">{f.title}</h3>
                <p className={highlight ? "relative mt-2 leading-relaxed text-white/65" : "mt-2 leading-relaxed text-ink-500"}>{f.body}</p>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ───────────── PRINCIPLE ───────────── */}
      <section className="relative overflow-hidden border-y border-sand-200 bg-sand-50 py-24 sm:py-32">
        <div className="container-x relative grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow={t("principle.eyebrow")} title={t("principle.title")} subtitle={t("principle.body")} />
            <ul className="mt-10 space-y-4">
              {points.map((p, i) => (
                <Reveal key={i} delay={i * 80} className="flex items-center gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-green-50 text-green-600 ring-1 ring-inset ring-green-600/15"><IconCheck width={15} height={15} /></span>
                  <span className="text-ink-700">{p}</span>
                </Reveal>
              ))}
            </ul>
            <Reveal className="mt-10">
              <Link href="/trust" className="btn btn-ghost">
                {tc("learnMore")}
                <IconArrow width={16} height={16} />
              </Link>
            </Reveal>
          </div>
          <Reveal delay={150}>
            <div className="shadow-frame overflow-hidden rounded-[.875rem] bg-night-950 font-mono text-[13px] text-white" dir="ltr">
              <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3 text-xs text-white/50">
                <IconShield width={14} height={14} className="text-green-400" /> advisor.system.ts
              </div>
              <pre className="overflow-x-auto p-5 leading-7 text-white/80">
{`const rules = [
  `}<span className="text-gold-300">{`"Use ONLY numbers returned by tools"`}</span>{`,
  `}<span className="text-gold-300">{`"Use ONLY dated, official rule texts"`}</span>{`,
  `}<span className="text-gold-300">{`"Always show source + data_until"`}</span>{`,
  `}<span className="text-gold-300">{`"Unknown zone → tell user to confirm"`}</span>{`,
  `}<span className="text-gold-300">{`"Facts, never buy recommendations"`}</span>{`,
];

const tools = [`}
<span className="text-green-300">{`
  get_district_stats, compare_districts,
  check_foreign_ownership, estimate_costs,
  search_rules, check_asking_price,
  create_report,`}</span>{`
];`}
              </pre>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────────── DISTRICTS PREVIEW ───────────── */}
      <section className="container-x py-24 sm:py-32">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading eyebrow={td("eyebrow")} title={td("title")} subtitle={td("subtitle")} />
          <Reveal>
            <Link href="/districts" className="btn btn-primary">
              {td("eyebrow")}
              <IconArrow width={16} height={16} />
            </Link>
          </Reveal>
        </div>
        <Reveal className="mt-12">
          <DistrictExplorer limit={6} />
          <p className="mt-3 text-center text-xs text-ink-400">{tc("sampleDataLong")}</p>
        </Reveal>
      </section>

      {/* ───────────── LANGUAGES ───────────── */}
      <section className="border-y border-sand-200 bg-sand-50 py-24 sm:py-32">
        <div className="container-x">
          <SectionHeading center eyebrow={t("languages.eyebrow")} title={t("languages.title")} subtitle={t("languages.subtitle")} />
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {languageSamples.map((s, i) => (
              <Reveal key={s.locale} delay={i * 80} className="card flex flex-col justify-between p-6">
                <span className="text-xs font-medium text-ink-400">{localeNames[s.locale].native}</span>
                <p lang={s.locale} dir={s.locale === "ar" || s.locale === "ur" ? "rtl" : "ltr"} className="mt-6 text-lg font-semibold leading-snug text-ink-900">
                  &ldquo;{s.text}&rdquo;
                </p>
                <Link href="/" locale={s.locale} className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-ink-900 hover:text-green-600">
                  {localeNames[s.locale].native} <IconArrow width={14} height={14} />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── PERSONAS ───────────── */}
      <section className="container-x py-24 sm:py-32">
        <SectionHeading eyebrow={t("personas.eyebrow")} title={t("personas.title")} />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {personas.map((p, i) => {
            const Icon = personaIcons[i];
            return (
              <Reveal key={i} delay={i * 90}>
                <Link href="/solutions" className="card group flex h-full flex-col p-7 transition hover:border-sand-300 hover:shadow-md">
                  <span className="grid h-12 w-12 place-items-center rounded-xl border border-sand-200 bg-sand-50 text-ink-900 transition group-hover:text-green-600">
                    <Icon width={22} height={22} />
                  </span>
                  <h3 className="mt-6 text-lg font-semibold">{p.title}</h3>
                  <p className="mt-2 flex-1 leading-relaxed text-ink-500">{p.body}</p>
                  <IconArrow width={18} height={18} className="flip-rtl mt-6 text-ink-400 transition group-hover:translate-x-1 group-hover:text-ink-900 rtl:group-hover:-translate-x-1" />
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ───────────── STATS ───────────── */}
      <section className="container-x">
        <div className="grid overflow-hidden rounded-2xl border border-sand-200 bg-white sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={i} delay={i * 80} className="border-sand-200 p-8 text-center [&:not(:last-child)]:border-b sm:[&:nth-child(odd)]:border-e lg:border-b-0 lg:[&:not(:last-child)]:border-e">
              <p className="font-display text-5xl text-ink-900" dir="ltr">{s.value}</p>
              <p className="mt-3 text-sm text-ink-500">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────────── PRICING TEASER ───────────── */}
      <section className="container-x py-24 sm:py-32">
        <Reveal className="relative overflow-hidden rounded-2xl border border-sand-200 bg-sand-50 p-8 sm:p-14">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <p className="eyebrow">{t("pricingTeaser.eyebrow")}</p>
              <h2 className="font-display mt-4 text-3xl leading-tight sm:text-4xl">{t("pricingTeaser.title")}</h2>
              <p className="mt-3 text-lg text-ink-500">{t("pricingTeaser.subtitle")}</p>
            </div>
            <Link href="/pricing" className="btn btn-primary">
              {t("pricingTeaser.cta")}
              <IconArrow width={16} height={16} />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section className="container-x grid gap-12 pb-8 lg:grid-cols-[1fr_1.6fr]">
        <SectionHeading eyebrow={t("faq.eyebrow")} title={t("faq.title")} />
        <Reveal>
          <FAQ items={faq} />
        </Reveal>
      </section>

      <CTASection />
    </>
  );
}
