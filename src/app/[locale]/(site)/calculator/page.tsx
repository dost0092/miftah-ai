import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/Section";
import { CostCalculator } from "@/components/CostCalculator";
import { CTASection } from "@/components/CTASection";
import { pageMetadata } from "@/lib/site";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "calculator" });
  return pageMetadata({ locale, path: "/calculator", title: t("title"), description: t("subtitle") });
}

export default async function CalculatorPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("calculator");
  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
      <section className="container-x py-16">
        <CostCalculator />
        <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-ink-400">{t("disclaimer")}</p>
      </section>
      <CTASection />
    </>
  );
}
