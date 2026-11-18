import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getLibrary } from "@/lib/workspace/library";
import { getAppSession } from "@/lib/workspace/session";
import { logActivity } from "@/lib/workspace/store";
import { KNOWLEDGE_AS_OF } from "@/lib/official/knowledge";
import { cn, fmtDate, fmtNumber } from "@/lib/format";
import { PageHeader, StatusBadge } from "@/components/app/ui";
import { IconChat, IconChevron, IconDatabase, IconExternal, IconSearch } from "@/components/Icons";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ c?: string; q?: string; doc?: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.nav" });
  return { title: t("library") };
}

export default async function LibraryPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { c: cat, q: rawQ, doc: openDoc } = await searchParams;
  const t = await getTranslations("app.library");
  const td = await getTranslations("app.dashboard");
  const ts = await getTranslations("app.advisor.status");
  const rtl = locale === "ar" || locale === "ur";
  const { docs, sources, origin } = await getLibrary();
  const q = (rawQ ?? "").trim().toLowerCase().slice(0, 100);
  if (q) {
    const s = await getAppSession();
    if (s) await logActivity(s, { kind: "search", title: rawQ!.trim().slice(0, 100), href: `/app/library?q=${encodeURIComponent(rawQ!.trim())}` });
  }

  const categories = [...new Set(docs.map((d) => d.category))];
  const sourceById = new Map(sources.map((s) => [s.id, s]));
  const shown = docs.filter(
    (d) => (!cat || d.category === cat) && (!q || [d.title, d.titleAr, d.summary, ...d.keywords, ...d.paragraphs].join(" ").toLowerCase().includes(q)),
  );
  const chunks = docs.reduce((n, d) => n + d.paragraphs.length, 0);
  const href = (c?: string) => ({ pathname: "/app/library", query: { ...(c ? { c } : {}), ...(rawQ ? { q: rawQ } : {}) } });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { k: td("documents"), v: fmtNumber(locale, docs.length) },
          { k: t("chunks"), v: fmtNumber(locale, chunks) },
          { k: td("sources"), v: fmtNumber(locale, sources.length) },
          { k: td("toVerify"), v: fmtNumber(locale, docs.filter((d) => d.status === "needs_review").length) },
        ].map((x) => (
          <div key={x.k} className="rounded-2xl border border-sand-200 bg-white p-4">
            <p className="text-xs text-ink-500">{x.k}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-ink-900" dir="ltr">{x.v}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-500">
        <IconDatabase width={14} height={14} />
        <StatusBadge status={origin === "database" ? "verified" : "sample"} label={origin === "database" ? td("dataLive") : td("dataBundled")} />
        <span>· {fmtDate(locale, KNOWLEDGE_AS_OF)}</span>
        <span className="text-ink-400">· {t("statusNote")}</span>
      </p>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
          <Link href={href()} className={cn("shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition", !cat ? "bg-night-950 text-white" : "text-ink-700 hover:bg-sand-100")}>{t("all")}</Link>
          {categories.map((c) => (
            <Link key={c} href={href(c)} className={cn("shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition", cat === c ? "bg-night-950 text-white" : "text-ink-700 hover:bg-sand-100")}>
              {t(`category.${c}` as "category.tax")}
            </Link>
          ))}
        </nav>
        <form className="flex w-full items-center gap-2 rounded-xl border border-sand-200 bg-white px-3 py-2 lg:w-80">
          {cat && <input type="hidden" name="c" value={cat} />}
          <IconSearch width={16} height={16} className="text-ink-400" />
          <input name="q" defaultValue={rawQ ?? ""} placeholder={t("searchPlaceholder")} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-400" />
        </form>
      </div>

      {/* Documents */}
      <div className="mt-5 space-y-3">
        {shown.length === 0 && <p className="rounded-2xl border border-dashed border-sand-300 p-10 text-center text-sm text-ink-500">{t("noResults")}</p>}
        {shown.map((d) => {
          const src = sourceById.get(d.sourceId);
          return (
            <details key={d.id} id={d.id} open={openDoc === d.id} className="group scroll-mt-24 rounded-2xl border border-sand-200 bg-white transition open:shadow-[0_10px_30px_-18px_rgb(11_13_18/.35)]">
              <summary className="flex cursor-pointer list-none items-start gap-4 p-5 [&::-webkit-details-marker]:hidden">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-sand-100 px-2 py-0.5 text-[11px] font-medium text-ink-500">{t(`category.${d.category}` as "category.tax")}</span>
                    <StatusBadge status={d.status} label={ts(d.status as "verified")} />
                  </div>
                  <h2 className="mt-2 text-[15px] font-semibold text-ink-900">{rtl && d.titleAr ? d.titleAr : d.title}</h2>
                  <p className="text-sm text-ink-400"><span dir={rtl ? "ltr" : "rtl"}>{rtl ? d.title : d.titleAr}</span></p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{d.summary}</p>
                  <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
                    {src && <span>{src.name}</span>}
                    {d.effective && <span>{t("effective")}: <span dir="ltr">{d.effective}</span></span>}
                    <span>{t("checked")}: {d.checked ? fmtDate(locale, d.checked) : t("notChecked")}</span>
                  </p>
                </div>
                <IconChevron width={18} height={18} className="mt-1 shrink-0 text-ink-400 transition group-open:rotate-180" />
              </summary>
              <div className="border-t border-sand-200 px-5 pb-5 pt-4">
                <ol className="space-y-3">
                  {d.paragraphs.map((p, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink-700">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-sand-100 text-[10px] font-semibold text-ink-500" dir="ltr">{i + 1}</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-5 flex flex-wrap gap-2">
                  <a href={d.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !py-2 text-sm">
                    <IconExternal width={15} height={15} /> {src?.name ?? d.url}
                  </a>
                  <Link href={`/app/advisor?q=${encodeURIComponent(`Explain: ${d.title}`)}`} className="btn btn-primary !py-2 text-sm">
                    <IconChat width={15} height={15} /> {t("ask")}
                  </Link>
                </div>
              </div>
            </details>
          );
        })}
      </div>

      {/* Sources directory */}
      <h2 className="mt-12 text-lg font-semibold text-ink-900">{t("sourcesTitle")}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sources.map((s) => (
          <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="group rounded-2xl border border-sand-200 bg-white p-4 transition hover:border-green-300">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-900">{s.name}</p>
                <p className="text-xs text-ink-400" dir="rtl">{s.nameAr}</p>
              </div>
              <IconExternal width={15} height={15} className="shrink-0 text-ink-400 group-hover:text-green-600" />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-500">{s.description}</p>
            <p className="mt-3 truncate text-[11px] text-green-700" dir="ltr">{s.url.replace(/^https?:\/\//, "")}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
