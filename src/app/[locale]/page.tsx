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
  const features = t.raw("features.items") as Item[];
  const points = t.raw("principle.points") as string[];
  const personas = t.raw("personas.items") as Item[];
  const stats = t.raw("stats.items") as Array<{ value: string; label: string }>;
  const sources = t.raw("sources.items") as string[];
  const faq = t.raw("faq.items") as Array<{ q: string; a: string }>;

  return (
    <>
      {/* ───────────── HERO ───────────── */}
      <section className="relative overflow-hidden bg-hero text-white">
        <div className="sadu-pattern pointer-events-none absolute inset-0" />
        <div className="grid-fade pointer-events-none absolute inset-0" />

        <div className="container-x relative grid items-center gap-14 pb-28 [&>*]:min-w-0 pt-16 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:pb-36 lg:pt-24">
          <div className="hero-in">
            <Link href="/trust" className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1.5 text-xs font-semibold text-gold-300 transition hover:bg-gold-400/15">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-gold-400" />
              {t("hero.badge")}
              <IconArrow width={13} height={13} />
            </Link>
            <h1 className="font-display mt-7 text-[2.75rem] leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.5rem]">
              {t("hero.titleA")} <span className="text-gradient-gold italic">{t("hero.titleHighlight")}</span>
              <br className="hidden sm:block" /> {t("hero.titleB")}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">{t("hero.subtitle")}</p>
            <div className="mt-8">
              <HeroAsk />
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/waitlist" className="btn btn-gold">
                {t("hero.ctaPrimary")}
                <IconArrow width={16} height={16} />
              </Link>
              <Link href="/districts" className="btn btn-ghost-dark">
                <IconSearch width={16} height={16} />
                {t("hero.ctaSecondary")}
              </Link>
            </div>
            <p className="mt-8 flex items-center gap-2 text-sm text-white/55">
              <IconShield width={16} height={16} className="text-gold-400" />
              {t("hero.trustNote")}
            </p>
          </div>
          <div className="hero-in-delay">
            <ChatDemo />
          </div>
        </div>

        {/* Desert dunes */}
        <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full sm:h-24" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden>
          <path fill="#c49a3c" fillOpacity=".25" d="M0 70C180 40 360 30 560 52s420 34 620 8 220-30 260-26V100H0Z" />
          <path fill="var(--color-sand-50)" d="M0 82C240 58 420 60 640 76s400 22 560 4 200-22 240-18V100H0Z" />
        </svg>
      </section>

      {/* ───────────── SOURCES STRIP ───────────── */}
      <section className="border-b border-sand-200 bg-sand-50 py-10">
        <div className="container-x">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-ink-400 rtl:tracking-normal">{t("sources.title")}</p>
          <div className="relative mt-6 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]" dir="ltr">
            <div className="flex w-max animate-marquee gap-12">
              {[...sources, ...sources].map((s, i) => (
                <span key={i} className="flex items-center gap-2.5 whitespace-nowrap text-lg font-semibold text-ink-400">
                  <IconDatabase width={18} height={18} className="text-gold-500" />
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
              <span className="font-display text-6xl text-gold-300 transition group-hover:text-gold-400" dir="ltr">0{i + 1}</span>
              <h3 className="mt-4 text-xl font-semibold text-ink-900">{p.title}</h3>
              <p className="mt-3 leading-relaxed text-ink-500">{p.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────────── HOW IT WORKS ───────────── */}
      <section className="relative bg-sand-100 py-24 sm:py-32">
        <div className="container-x">
          <SectionHeading center eyebrow={t("how.eyebrow")} title={t("how.title")} subtitle={t("how.subtitle")} />
          <div className="relative mt-16 grid gap-6 md:grid-cols-4">
            <div className="absolute inset-x-[12%] top-8 hidden h-px bg-gradient-to-r from-green-600/0 via-green-600/40 to-green-600/0 md:block" />
            {steps.map((s, i) => {
              const Icon = stepIcons[i];
              return (
                <Reveal key={i} delay={i * 120} className="relative text-center">
                  <span className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-green-600 text-white shadow-lg shadow-green-600/30">
                    <Icon width={26} height={26} />
                    <span className="absolute -end-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-gold-400 text-xs font-bold text-green-950">{i + 1}</span>
                  </span>
                  <h3 className="mt-6 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.body}</p>
                </Reveal>
              );
            })}
          </div>
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
                className={highlight ? "relative overflow-hidden rounded-[1.25rem] bg-green-800 p-7 text-white" : "card p-7 transition hover:-translate-y-1 hover:shadow-xl"}
              >
                {highlight && <div className="sadu-pattern pointer-events-none absolute inset-0" />}
                <span className={highlight ? "relative grid h-12 w-12 place-items-center rounded-xl bg-gold-400 text-green-950" : "grid h-12 w-12 place-items-center rounded-xl bg-green-50 text-green-600"}>
                  <Icon width={22} height={22} />
                </span>
                <h3 className="relative mt-6 text-lg font-semibold">{f.title}</h3>
                <p className={highlight ? "relative mt-2 leading-relaxed text-white/75" : "mt-2 leading-relaxed text-ink-500"}>{f.body}</p>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ───────────── PRINCIPLE ───────────── */}
      <section className="relative overflow-hidden bg-green-950 py-24 text-white sm:py-32">
        <div className="sadu-pattern pointer-events-none absolute inset-0 opacity-70" />
        <div className="container-x relative grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading dark eyebrow={t("principle.eyebrow")} title={t("principle.title")} subtitle={t("principle.body")} />
            <ul className="mt-10 space-y-4">
              {points.map((p, i) => (
                <Reveal key={i} delay={i * 80} className="flex items-center gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold-400/15 text-gold-300"><IconCheck width={15} height={15} /></span>
                  <span className="text-white/85">{p}</span>
                </Reveal>
              ))}
            </ul>
            <Reveal className="mt-10">
              <Link href="/trust" className="btn btn-ghost-dark">
                {tc("learnMore")}
                <IconArrow width={16} height={16} />
              </Link>
            </Reveal>
          </div>
          <Reveal delay={150}>
            <div className="card-dark overflow-hidden font-mono text-[13px]" dir="ltr">
              <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3 text-xs text-white/50">
                <IconShield width={14} height={14} className="text-gold-400" /> advisor.system.ts
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
      <section className="bg-sand-100 py-24 sm:py-32">
        <div className="container-x">
          <SectionHeading center eyebrow={t("languages.eyebrow")} title={t("languages.title")} subtitle={t("languages.subtitle")} />
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {languageSamples.map((s, i) => (
              <Reveal key={s.locale} delay={i * 80} className="card flex flex-col justify-between p-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-gold-600">{localeNames[s.locale].native}</span>
                <p lang={s.locale} dir={s.locale === "ar" || s.locale === "ur" ? "rtl" : "ltr"} className="mt-6 text-lg font-semibold leading-snug text-ink-900">
                  &ldquo;{s.text}&rdquo;
                </p>
                <Link href="/" locale={s.locale} className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-green-700">
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
                <Link href="/solutions" className="card group flex h-full flex-col p-7 transition hover:-translate-y-1 hover:border-green-600/30">
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-sand-200 text-green-600 transition group-hover:border-green-600 group-hover:bg-green-600 group-hover:text-white">
                    <Icon width={22} height={22} />
                  </span>
                  <h3 className="mt-6 text-lg font-semibold">{p.title}</h3>
                  <p className="mt-2 flex-1 leading-relaxed text-ink-500">{p.body}</p>
                  <IconArrow width={18} height={18} className="mt-6 text-green-600 transition group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ───────────── STATS ───────────── */}
      <section className="container-x">
        <div className="grid overflow-hidden rounded-[2rem] border border-sand-200 bg-white sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={i} delay={i * 80} className="border-sand-200 p-8 text-center [&:not(:last-child)]:border-b sm:[&:nth-child(odd)]:border-e lg:border-b-0 lg:[&:not(:last-child)]:border-e">
              <p className="font-display text-5xl text-green-600" dir="ltr">{s.value}</p>
              <p className="mt-3 text-sm text-ink-500">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────────── PRICING TEASER ───────────── */}
      <section className="container-x py-24 sm:py-32">
        <Reveal className="relative overflow-hidden rounded-[2rem] border border-gold-300 bg-gradient-to-br from-gold-100 via-sand-50 to-white p-8 sm:p-14">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <p className="eyebrow !text-gold-700"><span className="h-px w-6 bg-gold-500" />{t("pricingTeaser.eyebrow")}</p>
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
