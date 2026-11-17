import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageHero, SectionHeading } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { CTASection } from "@/components/CTASection";
import { ChatDemo } from "@/components/ChatDemo";
import { IconArrow, IconCalc, IconCheck, IconDoc, IconShield } from "@/components/Icons";
import { DistrictExplorer } from "@/components/DistrictExplorer";
import { LogoMark } from "@/components/Logo";
import { ZoneBadge } from "@/components/ZoneBadge";
import { pageMetadata } from "@/lib/site";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "product" });
  return pageMetadata({ locale, path: "/product", title: t("eyebrow"), description: t("subtitle") });
}

const anchors = ["advisor", "zones", "districts", "calculator", "reports"];

export default async function ProductPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("product");
  const c = await getTranslations("common");
  const calc = await getTranslations("calculator");
  const nav = await getTranslations("nav");
  const modules = t.raw("modules") as Array<{ tag: string; title: string; body: string; points: string[] }>;
  const roadmap = t.raw("roadmap.items") as Array<{ stage: string; when: string; body: string }>;

  const visuals = [
    <ChatDemo key="chat" />,
    <div key="zones" className="card space-y-3 p-6">
      {(["yes", "conditional", "no", "unknown"] as const).map((z) => (
        <div key={z} className="flex items-center justify-between gap-4 rounded-xl border border-sand-200 p-4">
          <div>
            <ZoneBadge status={z} label={c(`zone.${z}`)} />
            <p className="mt-2 text-sm text-ink-500">{c(`zoneHint.${z}`)}</p>
          </div>
          <IconShield className="shrink-0 text-sand-300" />
        </div>
      ))}
    </div>,
    <DistrictExplorer key="map" limit={5} />,
    <div key="calc" className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-sand-200 bg-sand-50 px-6 py-4 font-semibold">
        <IconCalc width={18} height={18} className="text-green-600" /> 1,500,000 SAR
      </div>
      <ul className="divide-y divide-sand-100 text-sm">
        {(["rett", "brokerage", "brokerageVat", "disposal"] as const).map((k) => (
          <li key={k} className="flex items-center justify-between gap-4 px-6 py-4">
            <span className="text-ink-700">{calc(`fees.${k}.name`)}</span>
            <span className="h-2 w-16 rounded-full bg-sand-200" />
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between bg-night-900 px-6 py-5 text-white">
        <span className="font-semibold">{calc("grandBuy")}</span>
        <span className="h-3 w-28 rounded-full bg-gold-400/70" />
      </div>
    </div>,
    <ReportMock key="doc" title={modules[4].tag} />,
  ];

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")}>
        <div className="mt-8 flex flex-wrap gap-2">
          {modules.map((m, i) => (
            <a key={i} href={`#${anchors[i]}`} className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10">
              {m.tag}
            </a>
          ))}
        </div>
      </PageHero>

      <div className="container-x space-y-28 py-24 sm:space-y-36 sm:py-32">
        {modules.map((m, i) => (
          <section key={i} id={anchors[i]} className="grid scroll-mt-28 items-center gap-12 lg:grid-cols-2">
            <Reveal className={i % 2 ? "lg:order-2" : ""}>
              <p className="eyebrow"><span className="h-px w-6 bg-green-600" />{m.tag}</p>
              <h2 className="font-display mt-4 text-3xl leading-tight sm:text-4xl">{m.title}</h2>
              <p className="mt-5 text-lg leading-relaxed text-ink-500">{m.body}</p>
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {m.points.map((p) => (
                  <li key={p} className="flex items-center gap-2.5 text-sm font-medium text-ink-700">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-green-50 text-green-600"><IconCheck width={14} height={14} /></span>
                    {p}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={120} className={i % 2 ? "lg:order-1" : ""}>{visuals[i]}</Reveal>
          </section>
        ))}
      </div>

      <section className="bg-sand-100 py-24 sm:py-32">
        <div className="container-x">
          <SectionHeading center eyebrow={t("roadmap.eyebrow")} title={t("roadmap.title")} />
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {roadmap.map((r, i) => (
              <Reveal key={i} delay={i * 100} className={i === 0 ? "rounded-[1.25rem] bg-night-800 p-8 text-white" : "card p-8"}>
                <div className="flex items-center justify-between">
                  <span className={i === 0 ? "rounded-full bg-gold-400 px-3 py-1 text-sm font-bold text-night-950" : "rounded-full bg-sand-100 px-3 py-1 text-sm font-bold text-ink-700"}>{r.stage}</span>
                  <span className={i === 0 ? "text-sm text-white/60" : "text-sm text-ink-400"}>{r.when}</span>
                </div>
                <p className={i === 0 ? "mt-6 leading-relaxed text-white/85" : "mt-6 leading-relaxed text-ink-500"}>{r.body}</p>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/waitlist" className="btn btn-primary">
              {nav("cta")}
              <IconArrow width={16} height={16} />
            </Link>
          </div>
        </div>
      </section>
      <CTASection />
    </>
  );
}

function ReportMock({ title }: { title: string }) {
  return (
    <div className="relative grid place-items-center overflow-hidden rounded-[1.5rem] bg-night-800 px-6 py-12">
      <div className="sadu-pattern absolute inset-0" />
      <div className="absolute -bottom-24 -end-24 h-72 w-72 rounded-full bg-gold-500/30 blur-3xl" />
      <div className="relative w-full max-w-xs rotate-[-3deg] rounded-xl bg-white p-6 shadow-2xl animate-float">
        <div className="flex items-center justify-between">
          <LogoMark className="h-7 w-7" />
          <IconDoc width={18} height={18} className="text-ink-400" />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-gold-600">{title}</p>
        <p className="mt-1 text-lg font-semibold">Al Malqa, Riyadh</p>
        <svg viewBox="0 0 200 60" className="mt-4 w-full" aria-hidden>
          <path d="M0 50 L30 44 L60 46 L90 34 L120 30 L150 22 L200 12" fill="none" stroke="#00804a" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div className="mt-4 space-y-2">
          <span className="block h-2 w-full rounded-full bg-sand-200" />
          <span className="block h-2 w-4/5 rounded-full bg-sand-200" />
          <span className="block h-2 w-3/5 rounded-full bg-sand-200" />
        </div>
      </div>
    </div>
  );
}
