import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { CTASection } from "@/components/CTASection";
import { IconArrow, IconBriefcase, IconBuilding, IconCheck, IconPlane, IconUser, IconDatabase } from "@/components/Icons";
import { cn } from "@/lib/format";
import { pageMetadata } from "@/lib/site";

type Params = { params: Promise<{ locale: string }> };
type Item = { id: string; title: string; question: string; body: string; points: string[] };

const icons = [IconUser, IconPlane, IconBriefcase, IconBuilding, IconDatabase];

export async function generateMetadata({ params }: Params) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "solutions" });
  return pageMetadata({ locale, path: "/solutions", title: t("eyebrow"), description: t("subtitle") });
}

export default async function SolutionsPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("solutions");
  const nav = await getTranslations("nav");
  const items = t.raw("items") as Item[];

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")}>
        <div className="mt-8 flex flex-wrap gap-2">
          {items.map((i) => (
            <a key={i.id} href={`#${i.id}`} className="rounded-full border border-sand-200 bg-white px-4 py-2 text-sm text-ink-700 shadow-sm transition hover:border-sand-300 hover:text-ink-900">
              {i.title}
            </a>
          ))}
        </div>
      </PageHero>
      <div className="container-x space-y-6 py-20">
        {items.map((item, idx) => {
          const Icon = icons[idx];
          const dark = idx % 2 === 1;
          return (
            <Reveal key={item.id}>
              <section
                id={item.id}
                className={cn(
                  "relative grid scroll-mt-28 gap-10 overflow-hidden rounded-[1.75rem] p-8 sm:p-12 lg:grid-cols-[1.2fr_1fr]",
                  dark ? "rounded-[.875rem] bg-night-950 text-white" : "card",
                )}
              >
                {dark && <div className="sadu-pattern pointer-events-none absolute inset-0" />}
                <div className="relative">
                  <span className={cn("grid h-14 w-14 place-items-center rounded-2xl", dark ? "bg-white/10 text-white ring-1 ring-white/15" : "bg-sand-100 text-ink-900 ring-1 ring-sand-200")}>
                    <Icon width={26} height={26} />
                  </span>
                  <h2 className="font-display mt-6 text-3xl sm:text-4xl">{item.title}</h2>
                  <p className={cn("mt-4 text-lg italic", dark ? "text-white/90" : "text-ink-900")}>{item.question}</p>
                  <p className={cn("mt-4 leading-relaxed", dark ? "text-white/75" : "text-ink-500")}>{item.body}</p>
                  <Link href={item.id === "brokers" || item.id === "enterprise" ? "/contact" : "/signup"} className={cn("btn mt-8", dark ? "btn-gold" : "btn-primary")}>
                    {item.id === "brokers" || item.id === "enterprise" ? nav("contact") : nav("cta")}
                    <IconArrow width={16} height={16} />
                  </Link>
                </div>
                <ul className="relative grid content-center gap-3">
                  {item.points.map((p) => (
                    <li key={p} className={cn("flex items-center gap-3 rounded-2xl p-4", dark ? "border border-white/10 bg-white/5" : "border border-sand-200 bg-sand-50")}>
                      <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full", dark ? "bg-white/10 text-white" : "bg-green-50 text-green-600 ring-1 ring-inset ring-green-600/15")}>
                        <IconCheck width={14} height={14} />
                      </span>
                      <span className="font-medium">{p}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          );
        })}
      </div>
      <CTASection />
    </>
  );
}
