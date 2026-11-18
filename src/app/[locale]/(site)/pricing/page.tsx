import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { FAQ } from "@/components/FAQ";
import { CTASection } from "@/components/CTASection";
import { IconArrow, IconCheck, IconDatabase } from "@/components/Icons";
import { cn } from "@/lib/format";
import { pageMetadata } from "@/lib/site";

type Params = { params: Promise<{ locale: string }> };
type Plan = { name: string; price: string; period: string; desc: string; features: string[]; cta: string; popular?: boolean };

export async function generateMetadata({ params }: Params) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing" });
  return pageMetadata({ locale, path: "/pricing", title: t("eyebrow"), description: t("subtitle") });
}

export default async function PricingPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pricing");
  const h = await getTranslations("home");
  const plans = t.raw("plans") as Plan[];
  const faq = h.raw("faq.items") as Array<{ q: string; a: string }>;
  const periodLabel = (p: string) => (p === "monthly" ? t("monthly") : p === "perReport" ? t("perReport") : "");

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
      <section className="container-x -mt-10 pb-16 sm:-mt-12">
        <div className="relative grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((p, i) => (
            <Reveal
              key={p.name}
              delay={i * 80}
              className={cn(
                "flex flex-col rounded-[1.5rem] p-7",
                p.popular ? "rounded-[.875rem] bg-night-950 text-white shadow-frame" : "card",
              )}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{p.name}</h2>
                {p.popular && <span className="rounded-full bg-green-600 px-2.5 py-1 text-xs font-semibold text-white">{t("popular")}</span>}
              </div>
              <p className={cn("mt-2 text-sm", p.popular ? "text-white/70" : "text-ink-500")}>{p.desc}</p>
              <p className="mt-6 flex items-baseline gap-1" dir="ltr">
                <span className="font-display text-5xl">{p.price}</span>
                <span className={cn("text-sm", p.popular ? "text-white/60" : "text-ink-400")}>{periodLabel(p.period)}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <IconCheck width={16} height={16} className={cn("mt-0.5 shrink-0", p.popular ? "text-green-300" : "text-green-600")} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={i === 3 ? "/contact" : "/waitlist"} className={cn("btn mt-8 w-full", p.popular ? "btn-gold" : "btn-ghost")}>
                {p.cta}
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-6">
          <div className="card flex flex-col items-start justify-between gap-6 p-7 sm:flex-row sm:items-center">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-sand-100 text-ink-900 ring-1 ring-sand-200"><IconDatabase /></span>
              <div>
                <h2 className="text-lg font-semibold">{t("enterprise.title")}</h2>
                <p className="mt-1 text-ink-500">{t("enterprise.body")}</p>
              </div>
            </div>
            <Link href="/contact" className="btn btn-primary shrink-0">
              {t("enterprise.cta")} <IconArrow width={16} height={16} />
            </Link>
          </div>
        </Reveal>
        <p className="mt-6 text-center text-xs text-ink-400">{t("note")}</p>
      </section>

      <section className="container-x max-w-4xl py-16">
        <FAQ items={faq} />
      </section>
      <CTASection />
    </>
  );
}
