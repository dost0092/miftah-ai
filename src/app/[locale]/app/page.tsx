import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAppSession, displayName } from "@/lib/workspace/session";
import { activityByDay, activityCounts, recentActivity, type ActivityKind } from "@/lib/workspace/store";
import { getLibrary } from "@/lib/workspace/library";
import { savedFromUser } from "@/lib/account-store";
import { DATA_UNTIL, IS_SAMPLE_DATA, getDistrict, trendChange } from "@/lib/districts";
import { cn, fmtDate, fmtNumber, fmtPercent, fmtRelative } from "@/lib/format";
import { AskBox } from "@/components/app/AskBox";
import { EmptyState, Panel, StatusBadge } from "@/components/app/ui";
import { LogoMark } from "@/components/Logo";
import { Sparkline } from "@/components/Sparkline";
import { IconArrow, IconBook, IconCalc, IconChat, IconCheck, IconChevron, IconDatabase, IconMap, IconPlus, IconReport, IconSearch, IconShield } from "@/components/Icons";

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

  const [counts, recent, library, days] = await Promise.all([activityCounts(session), recentActivity(session, 6), getLibrary(), activityByDay(session, 14)]);
  const name = displayName(session);
  const saved = savedFromUser(session.user).map(getDistrict).filter((d): d is NonNullable<typeof d> => Boolean(d));
  const toVerify = library.docs.filter((d) => d.status === "needs_review").length;
  const today = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  const kpis: { kind: ActivityKind; href: string; Icon: typeof IconChat }[] = [
    { kind: "chat", href: "/app/advisor", Icon: IconChat },
    { kind: "map_view", href: "/app/map", Icon: IconMap },
    { kind: "search", href: "/app/library", Icon: IconSearch },
    { kind: "report", href: "/app/reports", Icon: IconReport },
  ];

  const max = Math.max(4, ...days.map((d) => d.count));
  const total14 = days.reduce((s, d) => s + d.count, 0);
  const dayLabel = (iso: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

  const shortcuts = [
    { href: "/app/map", label: t("quickMap"), Icon: IconMap },
    { href: "/app/calculator", label: t("quickCalc"), Icon: IconCalc },
    { href: "/app/library", label: t("quickLibrary"), Icon: IconBook },
    { href: "/app/reports/new", label: t("quickReport"), Icon: IconReport },
  ];

  return (
    <div className="min-h-full bg-sand-50/60">
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-8 sm:px-6 lg:pt-10">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <p className="text-sm text-ink-400">{today}</p>
            <h1 className="mt-1 truncate text-2xl font-semibold tracking-[-0.02em] text-ink-900 sm:text-[1.85rem]">{name ? t("welcome", { name }) : t("welcomeNoName")}</h1>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link href="/app/reports/new" className="btn btn-ghost !py-2 text-sm">
              <IconPlus width={16} height={16} /> {t("newReport")}
            </Link>
            <Link href="/app/advisor" className="btn btn-primary !py-2 text-sm">
              <IconChat width={16} height={16} /> {t("aiTitle")}
            </Link>
          </div>
        </div>

        {/* AI hero */}
        <section className="ai-hero mt-6 p-6 sm:p-8 lg:p-10">
          <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1fr_17rem]">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 py-1 pe-3 ps-1 text-xs font-medium text-white ring-1 ring-inset ring-white/15">
                <LogoMark className="h-6 w-6 rounded-full" /> Miftah AI
              </span>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-[2rem]">{t("heroTitle")}</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">{t("subtitle")}</p>
              <div className="mt-6">
                <AskBox onDark />
              </div>
            </div>
            <ul className="hidden space-y-2 lg:block" aria-hidden>
              {[
                ["REGA", "Real Estate General Authority"],
                ["ZATCA", "Zakat, Tax and Customs"],
                ["MOJ", "Ministry of Justice"],
                ["Ejar", "Rental network"],
              ].map(([k, v], i) => (
                <li key={k} className="flex items-center gap-3 rounded-xl bg-white/[.07] px-3 py-2.5 ring-1 ring-inset ring-white/10 backdrop-blur" style={{ marginInlineStart: `${(i % 2) * 18}px` }}>
                  <span className="grid h-7 min-w-[3rem] place-items-center rounded-md bg-white px-1.5 text-[10px] font-bold tracking-tight text-night-950" dir="ltr">{k}</span>
                  <span className="min-w-0 flex-1 truncate text-xs text-white/75" dir="ltr">{v}</span>
                  <IconCheck width={14} height={14} className="text-green-300" />
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* KPI strip */}
        <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-[0_1px_2px_rgb(11_13_18/.04)] lg:grid-cols-4">
          {kpis.map(({ kind, href, Icon }, i) => (
            <Link
              key={kind}
              href={href}
              className={cn(
                "group relative block p-5 transition hover:bg-sand-50 sm:p-6",
                i % 2 === 1 && "border-s border-sand-200",
                i >= 2 && "border-t border-sand-200 lg:border-t-0",
                i === 2 && "lg:border-s",
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-green-50 text-green-600 ring-1 ring-inset ring-green-600/10"><Icon width={16} height={16} /></span>
                <p className="text-sm font-medium text-ink-500">{t(`kpi.${kind}`)}</p>
              </div>
              <p className="mt-4 text-[2rem] font-semibold leading-none tracking-[-0.03em] text-ink-900 tabular-nums" dir="ltr">{fmtNumber(locale, counts[kind])}</p>
              <p className="mt-2 flex items-center justify-between text-xs text-ink-400">
                {t("allTime")}
                <IconArrow width={14} height={14} className="flip-rtl opacity-0 transition group-hover:opacity-100" />
              </p>
            </Link>
          ))}
        </div>

        {/* Activity chart + shortcuts */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          <Panel
            title={t("activity")}
            action={
              <span className="text-xs text-ink-400">
                {t("last14")} · <span className="font-semibold text-ink-900" dir="ltr">{fmtNumber(locale, total14)}</span>
              </span>
            }
          >
            <div className="relative">
              <div className="flex h-40 items-end gap-1.5 border-b border-sand-200 sm:gap-2" role="img" aria-label={`${t("activity")}: ${total14}`}>
                {days.map((d) => (
                  <div key={d.day} className="group relative flex h-full flex-1 items-end justify-center" title={`${dayLabel(d.day)}: ${d.count}`}>
                    <div
                      className={cn("w-full max-w-7 rounded-t-[5px] transition", d.count ? "bg-gradient-to-t from-green-600 to-green-500 group-hover:from-green-700 group-hover:to-green-600" : "bg-sand-100")}
                      style={{ height: d.count ? `${Math.max(8, (d.count / max) * 100)}%` : "6px" }}
                    />
                  </div>
                ))}
              </div>
              {total14 === 0 && <p className="absolute inset-x-0 top-12 mx-auto max-w-xs text-center text-sm text-ink-400">{t("noActivity")}</p>}
              <div className="mt-2 flex justify-between text-[11px] text-ink-400" dir="ltr">
                <span>{dayLabel(days[0].day)}</span>
                <span>{dayLabel(days[Math.floor(days.length / 2)].day)}</span>
                <span>{dayLabel(days[days.length - 1].day)}</span>
              </div>
            </div>
          </Panel>

          <Panel title={t("quick")} bodyClass="!px-2 sm:!px-3">
            <ul className="space-y-0.5">
              {shortcuts.map(({ href, label, Icon }) => (
                <li key={href}>
                  <Link href={href} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-sand-50">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-sand-200 bg-white text-ink-700 transition group-hover:border-green-600 group-hover:bg-green-600 group-hover:text-white">
                      <Icon width={17} height={17} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900">{label}</span>
                    <IconChevron width={16} height={16} className="shrink-0 -rotate-90 text-ink-300 transition group-hover:text-ink-900 rtl:rotate-90" />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
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
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sand-100 text-ink-700"><Icon width={17} height={17} /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink-900">{a.title}</span>
                          <span className="mt-0.5 flex items-center gap-2 text-xs text-ink-400">
                            <span>{t(`kind.${a.kind}`)}</span>
                            <span aria-hidden>·</span>
                            <span>{fmtRelative(locale, a.created_at)}</span>
                          </span>
                        </span>
                        <IconChevron width={16} height={16} className="shrink-0 -rotate-90 text-ink-300 transition group-hover:text-ink-900 rtl:rotate-90" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <div className="space-y-6">
            {/* Plan */}
            <section className="relative overflow-hidden rounded-2xl bg-night-950 p-6 text-white">
              <div className="pointer-events-none absolute -end-16 -top-16 h-48 w-48 rounded-full bg-green-600/30 blur-3xl" aria-hidden />
              <p className="relative text-sm text-white/60">{t("plan")}</p>
              <p className="relative mt-1 flex items-center gap-2 text-lg font-semibold">
                {t("planName")}
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
              </p>
              <p className="relative mt-2 text-sm leading-relaxed text-white/65">{t("planBody")}</p>
              <Link href="/pricing" className="relative mt-5 inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-ink-900 transition hover:bg-sand-100">
                {t("viewPlans")} <IconArrow width={14} height={14} className="flip-rtl" />
              </Link>
            </section>

            {/* Data status */}
            <Panel title={t("data")} action={<StatusBadge status={library.origin === "database" ? "verified" : "sample"} label={library.origin === "database" ? t("dataLive") : t("dataBundled")} />}>
              <dl className="grid grid-cols-3 divide-x divide-sand-200 rounded-xl border border-sand-200 text-center rtl:divide-x-reverse">
                {[
                  { k: t("documents"), v: library.docs.length },
                  { k: t("sources"), v: library.sources.length },
                  { k: t("toVerify"), v: toVerify },
                ].map((x) => (
                  <div key={x.k} className="flex flex-col-reverse px-2 py-3">
                    <dt className="mt-0.5 text-[11px] leading-tight text-ink-500">{x.k}</dt>
                    <dd className="text-xl font-semibold tabular-nums text-ink-900" dir="ltr">{fmtNumber(locale, x.v)}</dd>
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

        <p className="mt-8 text-center text-xs text-ink-400">{c("notAdvice")}</p>
      </div>
    </div>
  );
}
