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
    <section className="relative overflow-hidden bg-hero">
      <div className="sadu-pattern pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -top-40 start-[-10%] h-[520px] w-[720px] rounded-full bg-green-500/25 blur-[120px]" />
      <div className="container-x relative grid gap-12 py-20 sm:py-24 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div className="hero-in text-white">
          <p className="eyebrow !text-gold-300"><span className="h-px w-6 bg-gold-400" />{t("eyebrow")}</p>
          <h1 className="font-display mt-5 text-4xl leading-[1.05] sm:text-6xl">{t("title")}</h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/75">{t("subtitle")}</p>
          <ul className="mt-10 space-y-4">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold-400 text-green-950"><IconCheck width={14} height={14} /></span>
                <span className="text-white/85">{p}</span>
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
