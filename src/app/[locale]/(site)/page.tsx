import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Link } from "@/i18n/navigation";
import { ChatDemo } from "@/components/ChatDemo";
import { HeroAsk } from "@/components/HeroAsk";
import { CTASection } from "@/components/CTASection";
import { FAQ } from "@/components/FAQ";
import { ProductTour } from "@/components/ProductTour";
import { ReviewedStamp } from "@/components/TrustKit";
import { LogoMark } from "@/components/Logo";
import { IconArrow, IconExternal } from "@/components/Icons";
import { KNOWLEDGE_AS_OF } from "@/lib/official/knowledge";
import { fmtDate } from "@/lib/format";

type Item = { title: string; body: string };
type Dated = { date: string; title: string; body: string; url: string; source: string };

/** Two-line section title: a short statement, then a quieter second line. */
function Heading({ a, b, className = "" }: { a: string; b?: string; className?: string }) {
  return (
    <h2 className={`max-w-2xl text-3xl font-semibold leading-[1.15] tracking-tight text-ink-900 sm:text-[2.6rem] ${className}`}>
      {a}
      {b && <span className="block text-ink-400">{b}</span>}
    </h2>
  );
}

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("home");

  const points = t.raw("lead.points") as string[];
  const ledger = t.raw("ledger.items") as Dated[];
  const who = t.raw("personas.items") as Item[];
  const honest = t.raw("honest.items") as Item[];
  const faq = t.raw("faq.items") as Array<{ q: string; a: string }>;

  return (
    <>
      {/* Hero: the product itself, not a banner */}
      <section className="border-b border-sand-200 bg-sand-50">
        <div className="container-x grid gap-12 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14 lg:pb-20">
          <div className="hero-in">
            <p className="flex items-center gap-2.5 text-sm font-medium text-ink-700">
              <LogoMark className="h-7 w-7" />
              {t("lead.kicker")}
            </p>
            <h1 className="mt-6 text-[2.5rem] font-semibold leading-[1.08] tracking-tight text-ink-900 sm:text-[3.4rem]">
              {t("lead.title1")}
              <span className="block text-green-700">{t("lead.title2")}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-600">{t("lead.subtitle")}</p>
            <div className="mt-8 max-w-xl">
              <HeroAsk />
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-500">
              {points.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-gold-500" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <figure className="hero-in-delay min-w-0">
            <ChatDemo />
          </figure>
        </div>
      </section>

      {/* What changed, with dates and links */}
      <section className="container-x py-20 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.7fr] lg:gap-16">
          <div>
            <Heading a={t("ledger.title1")} b={t("ledger.title2")} />
            <p className="mt-5 max-w-md leading-relaxed text-ink-600">{t("ledger.body")}</p>
            <Link href="/guide" className="mt-6 inline-flex items-center gap-1.5 font-semibold text-green-700 hover:underline">
              {t("ledger.cta")} <IconArrow width={15} height={15} className="flip-rtl" />
            </Link>
          </div>
          <div>
            <ol className="border-t border-ink-900/80">
              {ledger.map((row) => (
                <li key={row.title} className="grid gap-x-6 gap-y-1 border-b border-sand-200 py-5 sm:grid-cols-[130px_1fr]">
                  <p className="text-sm font-semibold tabular-nums text-ink-900">{fmtDate(locale, row.date)}</p>
                  <div>
                    <p className="font-semibold text-ink-900">{row.title}</p>
                    <p className="mt-1 leading-relaxed text-ink-600">{row.body}</p>
                    <a href={row.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-green-700 hover:underline">
                      {row.source} <IconExternal width={11} height={11} />
                    </a>
                  </div>
                </li>
              ))}
            </ol>
            <ReviewedStamp date={fmtDate(locale, KNOWLEDGE_AS_OF)} className="mt-4" />
          </div>
        </div>
      </section>

      {/* How it works: numbered steps, then the real screens */}
      <section id="demo" className="scroll-mt-24 border-y border-sand-200 bg-white py-20 sm:py-28">
        <div className="container-x">
          <Heading a={t("work.title1")} b={t("work.title2")} />
          <div className="mt-12">
            <ProductTour />
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="container-x py-20 sm:py-28">
        <Heading a={t("who.title1")} b={t("who.title2")} />
        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-sand-200 bg-sand-200 sm:grid-cols-2">
          {who.map((p) => (
            <Link key={p.title} href="/solutions" className="group flex flex-col bg-white p-6 transition hover:bg-sand-50 sm:p-8">
              <p className="flex items-center justify-between gap-4 text-lg font-semibold text-ink-900">
                {p.title}
                <IconArrow width={17} height={17} className="flip-rtl shrink-0 text-ink-400 transition group-hover:text-green-700" />
              </p>
              <p className="mt-2 leading-relaxed text-ink-600">{p.body}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Straight talk about the limits */}
      <section className="border-y border-sand-200 bg-sand-50 py-20 sm:py-28">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.7fr] lg:gap-16">
          <div>
            <Heading a={t("honest.title1")} b={t("honest.title2")} />
            <Link href="/trust" className="mt-6 inline-flex items-center gap-1.5 font-semibold text-green-700 hover:underline">
              {t("honest.cta")} <IconArrow width={15} height={15} className="flip-rtl" />
            </Link>
          </div>
          <dl className="grid gap-8 sm:grid-cols-2">
            {honest.map((h) => (
              <div key={h.title}>
                <dt className="font-semibold text-ink-900">{h.title}</dt>
                <dd className="mt-1.5 leading-relaxed text-ink-600">{h.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-x grid gap-10 py-20 sm:py-28 lg:grid-cols-[1fr_1.7fr] lg:gap-16">
        <Heading a={t("faq.title1")} b={t("faq.title2")} />
        <FAQ items={faq} />
      </section>

      <CTASection />
    </>
  );
}
