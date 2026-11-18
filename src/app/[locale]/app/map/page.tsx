import { getTranslations, setRequestLocale } from "next-intl/server";
import { DATA_UNTIL, IS_SAMPLE_DATA, QUARTERS, districts } from "@/lib/districts";
import { getLibrary } from "@/lib/workspace/library";
import { MarketMap } from "@/components/app/MarketMap";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ d?: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.nav" });
  return { title: t("map") };
}

export default async function MapPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { d } = await searchParams;
  const { docs } = await getLibrary();
  const rules = docs.map((x) => ({ id: x.id, title: x.title, summary: x.summary, url: x.url, status: x.status }));
  return <MarketMap districts={districts} quarters={QUARTERS} dataUntil={DATA_UNTIL} isSample={IS_SAMPLE_DATA} rules={rules} initial={d ?? null} />;
}
