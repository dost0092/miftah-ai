import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { WaitlistForm } from "@/components/WaitlistForm";
import { IconCheck } from "@/components/Icons";
import { pageMetadata } from "@/lib/site";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "waitlist" });
  return pageMetadata({ locale, path: "/waitlist", title: t("title"), description: t("subtitle") });
}

export default async function WaitlistPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("waitlist");
  const perks = t.raw("perks") as string[];

  return (
    <section className="relative overflow-hidden bg-canvas">
      <div className="grid-lines pointer-events-none absolute inset-0" />
      <div className="container-x relative grid gap-12 py-20 sm:py-24 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div className="hero-in">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="font-display mt-4 text-4xl leading-[1.05] text-ink-900 sm:text-6xl">{t("title")}</h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-500">{t("subtitle")}</p>
          <ul className="mt-10 space-y-4">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-green-50 text-green-600 ring-1 ring-inset ring-green-600/15"><IconCheck width={14} height={14} /></span>
                <span className="text-ink-700">{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="hero-in-delay">
          <Suspense fallback={<div className="card h-[520px] animate-pulse" />}>
            <WaitlistForm />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
