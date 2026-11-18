import { getTranslations, setRequestLocale } from "next-intl/server";
import { CostCalculator } from "@/components/CostCalculator";
import { PageHeader } from "@/components/app/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.calculator" });
  return { title: t("title") };
}

export default async function CalculatorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("app.calculator");
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="mt-6">
        <CostCalculator />
      </div>
    </div>
  );
}
