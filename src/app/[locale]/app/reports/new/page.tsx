import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { districts } from "@/lib/districts";
import { PageHeader } from "@/components/app/ui";
import { NewReportForm } from "@/components/app/NewReportForm";
import type { ReportType } from "@/lib/workspace/store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ type?: string; d?: string }> };

export default async function NewReportPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { type, d } = await searchParams;
  const t = await getTranslations("app.reports");
  const initialType: ReportType = type === "due_diligence" || type === "cost" ? type : "district";
  const initialDistrict = districts.some((x) => x.slug === d) ? d! : districts[0].slug;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
      <Link href="/app/reports" className="text-sm font-medium text-green-600 hover:text-green-700">← {t("back")}</Link>
      <div className="mt-3"><PageHeader title={t("newTitle")} /></div>
      <div className="mt-6 rounded-2xl border border-sand-200 bg-white p-5 sm:p-7">
        <NewReportForm districts={districts.map(({ slug, nameEn, nameAr, city }) => ({ slug, nameEn, nameAr, city }))} initialType={initialType} initialDistrict={initialDistrict} />
      </div>
    </div>
  );
}
