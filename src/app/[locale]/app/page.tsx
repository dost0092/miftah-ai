import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAppSession, displayName } from "@/lib/workspace/session";
import { activityCounts, recentActivity, type ActivityKind } from "@/lib/workspace/store";
import { getLibrary } from "@/lib/workspace/library";
import { savedFromUser } from "@/lib/account-store";
import { DATA_UNTIL, IS_SAMPLE_DATA, getDistrict, trendChange } from "@/lib/districts";
import { cn, fmtDate, fmtNumber, fmtPercent, fmtRelative } from "@/lib/format";
import { AskBox } from "@/components/app/AskBox";
import { EmptyState, Panel, StatusBadge } from "@/components/app/ui";
import { Sparkline } from "@/components/Sparkline";
import { IconArrow, IconBook, IconCalc, IconChat, IconChevron, IconDatabase, IconMap, IconReport, IconSearch, IconShield } from "@/components/Icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.nav" });
  return { title: t("dashboard") };
}

const kindIcon: Record<ActivityKind, typeof IconChat> = { chat: IconChat, map_view: IconMap, search: IconSearch, report: IconReport, calc: IconCalc };

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("app.dashboard");
  const ts = await getTranslations("app.advisor.status");
  const tl = await getTranslations("app.library.category");
  const c = await getTranslations("common");
  const session = (await getAppSession())!;
  const rtl = locale === "ar" || locale === "ur";

  const [counts, recent, library] = await Promise.all([activityCounts(session), recentActivity(session, 6), getLibrary()]);
  const name = displayName(session);
  const saved = savedFromUser(session.user).map(getDistrict).filter((d): d is NonNullable<typeof d> => Boolean(d));
  const toVerify = library.docs.filter((d) => d.status === "needs_review").length;

  const kpis: { kind: ActivityKind; href: string; Icon: typeof IconChat }[] = [
    { kind: "chat", href: "/app/advisor", Icon: IconChat },
    { kind: "map_view", href: "/app/map", Icon: IconMap },
    { kind: "search", href: "/app/library", Icon: IconSearch },
    { kind: "report", href: "/app/reports", Icon: IconReport },
  ];

  return (
    <div className="app-canvas min-h-full">
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 lg:pt-14">
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">{name ? t("welcome", { name }) : t("welcomeNoName")}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-500 sm:text-[15px]">{t("subtitle")}</p>
        </div>
        <div className="mt-8">
          <AskBox />
        </div>

        {/* KPI cards */}
        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {kpis.map(({ kind, href, Icon }) => (
            <Link key={kind} href={href} className="kpi-card group block p-5 transition hover:-translate-y-0.5">
              <div className="relative z-10 flex items-start justify-between">
                <p className="text-sm font-medium text-white/85">{t(`kpi.${kind}`)}</p>
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/12 text-white ring-1 ring-white/20"><Icon width={18} height={18} /></span>
              </div>
              <p className="relative z-10 mt-5 text-4xl font-semibold tracking-tight" dir="ltr">{fmtNumber(locale, counts[kind])}</p>
              <p className="relative z-10 mt-1 text-xs text-white/60">{t("allTime")}</p>
            </Link>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          {/* Recent activity */}
          <Panel title={t("resume")} bodyClass="!px-2 sm:!px-3">
            {recent.length === 0 ? (
              <EmptyState icon={<IconChat width={22} height={22} />} title={t("resumeEmpty")} action={<Link href="/app/advisor" className="btn btn-primary !py-2 text-sm">{t("startAsking")}</Link>} />
            ) : (
              <ul className="divide-y divide-sand-200">
                {recent.map((a) => {
                  const Icon = kindIcon[a.kind];
                  return (
                    <li key={a.id}>
                      <Link href={a.href ?? "/app"} className="group flex items-center gap-3.5 rounded-xl px-3 py-3 transition hover:bg-sand-50">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-green-50 text-green-600"><Icon width={17} height={17} /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink-900">{a.title}</span>
                          <span className="mt-0.5 flex items-center gap-2 text-xs text-ink-400">
                            <span className="text-green-700">{t(`kind.${a.kind}`)}</span>
                            <span aria-hidden>·</span>
                            <span>{fmtRelative(locale, a.created_at)}</span>
                          </span>
                        </span>
                        <IconChevron width={16} height={16} className="shrink-0 -rotate-90 text-ink-400 transition group-hover:text-ink-900 rtl:rotate-90" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <div className="space-y-6">
            {/* Plan */}
            <Panel title={t("plan")}>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-night-950 px-2.5 py-1 text-xs font-semibold text-white">{t("planName")}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-500">{t("planBody")}</p>
              <Link href="/pricing" className="btn btn-ghost mt-4 !py-2 text-sm">{t("viewPlans")}</Link>
            </Panel>

            {/* Data status */}
            <Panel
              title={t("data")}
              action={<StatusBadge status={library.origin === "database" ? "verified" : "sample"} label={library.origin === "database" ? t("dataLive") : t("dataBundled")} />}
            >
              <dl className="grid grid-cols-3 gap-3 text-center">
                {[
                  { k: t("documents"), v: library.docs.length },
                  { k: t("sources"), v: library.sources.length },
                  { k: t("toVerify"), v: toVerify },
                ].map((x) => (
                  <div key={x.k} className="rounded-xl bg-sand-50 px-2 py-3">
                    <dd className="text-xl font-semibold text-ink-900" dir="ltr">{fmtNumber(locale, x.v)}</dd>
                    <dt className="mt-0.5 text-[11px] leading-tight text-ink-500">{x.k}</dt>
                  </div>
                ))}
              </dl>
              <p className="mt-4 flex items-center justify-between text-xs text-ink-500">
                <span>{t("marketUntil")}</span>
                <span className="font-medium text-ink-900">{fmtDate(locale, DATA_UNTIL)}</span>
              </p>
              {IS_SAMPLE_DATA && <p className="mt-2 text-xs leading-relaxed text-amber-700">{t("sampleNote")}</p>}
              <Link href="/app/library" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700">
                <IconDatabase width={15} height={15} /> {t("openLibrary")}
              </Link>
            </Panel>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Saved districts */}
          <Panel title={t("saved")} action={<Link href="/app/map" className="text-sm font-medium text-green-600 hover:text-green-700">{t("openMap")}</Link>} bodyClass="!px-2 sm:!px-3">
            {saved.length === 0 ? (
              <EmptyState icon={<IconMap width={22} height={22} />} title={t("savedEmpty")} />
            ) : (
              <ul className="divide-y divide-sand-200">
                {saved.slice(0, 6).map((d) => {
                  const ch = trendChange(d);
                  return (
                    <li key={d.slug}>
                      <Link href={`/app/map?d=${d.slug}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-sand-50">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink-900">{rtl ? d.nameAr : d.nameEn}</span>
                          <span className="text-xs text-ink-400">{c(`city.${d.city}`)}</span>
                        </span>
                        <Sparkline id={`dash-${d.slug}`} values={d.trend} stroke={ch >= 0 ? "#047857" : "#b45309"} className="h-7 w-16" />
                        <span className="w-24 text-end text-sm tabular-nums text-ink-900" dir="ltr">{fmtNumber(locale, d.median.apartment)}</span>
                        <span className={cn("w-14 text-end text-xs font-semibold tabular-nums", ch >= 0 ? "text-emerald-700" : "text-amber-700")} dir="ltr">{fmtPercent(locale, ch)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {/* Official library highlights */}
          <Panel title={t("updates")} action={<Link href="/app/library" className="text-sm font-medium text-green-600 hover:text-green-700">{t("viewAll")}</Link>} bodyClass="!px-2 sm:!px-3">
            <ul className="divide-y divide-sand-200">
              {library.docs
                .filter((d) => d.status !== "guidance")
                .slice(0, 5)
                .map((d) => (
                  <li key={d.id}>
                    <Link href={`/app/library?doc=${d.id}#${d.id}`} className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-sand-50">
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sand-100 text-ink-500">{d.category === "ownership" ? <IconShield width={16} height={16} /> : <IconBook width={16} height={16} />}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink-900">{rtl && d.titleAr ? d.titleAr : d.title}</span>
                        <span className="mt-0.5 flex items-center gap-2 text-xs text-ink-400">
                          <span>{tl(d.category)}</span>
                          {d.effective && <><span aria-hidden>·</span><span dir="ltr">{d.effective}</span></>}
                        </span>
                      </span>
                      <StatusBadge status={d.status} label={ts(d.status)} />
                    </Link>
                  </li>
                ))}
            </ul>
          </Panel>
        </div>

        <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-ink-400">
          {c("notAdvice")} <IconArrow width={12} height={12} className="hidden" />
        </p>
      </div>
    </div>
  );
}
