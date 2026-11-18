import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAppSession } from "@/lib/workspace/session";
import { listReports } from "@/lib/workspace/store";
import { PageHeader } from "@/components/app/ui";
import { ReportsTable } from "@/components/app/ReportsTable";
import { IconPlus } from "@/components/Icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.nav" });
  return { title: t("reports") };
}

export default async function ReportsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("app.reports");
  const reports = await listReports((await getAppSession())!);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={<Link href="/app/reports/new" className="btn btn-primary !py-2.5 text-sm"><IconPlus width={16} height={16} /> {t("create")}</Link>}
      />
      <div className="mt-6">
        <ReportsTable reports={reports} />
      </div>
    </div>
  );
}
