import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { fmtDate } from "@/lib/format";
import { pageMetadata } from "@/lib/site";

const docs = ["privacy", "terms", "refunds", "disclaimer"] as const;
type Doc = (typeof docs)[number];
type Params = { params: Promise<{ locale: string; doc: string }> };

const UPDATED = "2026-11-17";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => docs.map((doc) => ({ locale, doc })));
}

export async function generateMetadata({ params }: Params) {
  const { locale, doc } = await params;
  if (!docs.includes(doc as Doc)) return {};
  const t = await getTranslations({ locale, namespace: `legal.${doc}` });
  return pageMetadata({ locale, path: `/legal/${doc}`, title: t("title"), description: t("intro") });
}

export default async function LegalPage({ params }: Params) {
  const { locale, doc } = await params;
  if (!docs.includes(doc as Doc)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations(`legal.${doc}`);
  const l = await getTranslations("legal");
  const f = await getTranslations("footer");
  const sections = t.raw("sections") as Array<{ h: string; p: string }>;

  return (
    <section className="container-x grid gap-10 py-16 lg:grid-cols-[220px_1fr]">
      <nav className="flex gap-2 lg:flex-col" aria-label="Legal">
        {docs.map((d) => (
          <Link
            key={d}
            href={`/legal/${d}`}
            className={d === doc ? "rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white" : "rounded-xl px-4 py-2.5 text-sm font-medium text-ink-500 hover:bg-sand-100"}
          >
            {f(d)}
          </Link>
        ))}
      </nav>
      <article className="max-w-3xl">
        <h1 className="font-display text-4xl sm:text-5xl">{t("title")}</h1>
        <p className="mt-3 text-sm text-ink-400">{l("updated")}: {fmtDate(locale, UPDATED)}</p>
        <p className="mt-8 text-lg leading-relaxed text-ink-700">{t("intro")}</p>
        <div className="mt-10 space-y-8">
          {sections.map((s, i) => (
            <div key={i}>
              <h2 className="text-xl font-semibold">{s.h}</h2>
              <p className="mt-3 leading-relaxed text-ink-500">{s.p}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
