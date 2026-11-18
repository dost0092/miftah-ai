import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createCookieSupabase } from "@/lib/supabase-auth";
import { getServerSupabase } from "@/lib/supabase";
import { getDistrict, trendChange } from "@/lib/districts";
import { cn, fmtDate, fmtNumber, fmtPercent } from "@/lib/format";
import { ProfileForm, SaveDistrictButton, SignOutButton } from "@/components/auth/AccountWidgets";
import { profileFromUser, savedFromUser } from "@/lib/account-store";
import { Sparkline } from "@/components/Sparkline";
import { ZoneBadge } from "@/components/ZoneBadge";
import { IconArrow, IconCalc, IconChat, IconCheck, IconGrid, IconMap, IconSpark, IconUser } from "@/components/Icons";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: t("title"), robots: { index: false } };
}

export default async function AccountPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");
  const a = await getTranslations("auth");
  const c = await getTranslations("common");
  const n = await getTranslations("nav");
  const td = await getTranslations("districts");

  const supabase = createCookieSupabase(await cookies());
  if (!supabase) {
    return <p className="container-x py-24 text-center text-ink-500">{a("notConfigured")}</p>;
  }
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return redirect({ href: { pathname: "/login", query: { next: `/${locale}/account` } }, locale });

  const profile = profileFromUser(user);
  const savedSlugs = savedFromUser(user);
  const admin = getServerSupabase();
  const onWaitlist = user.email && admin
    ? Boolean((await admin.from("waitlist").select("email").eq("email", user.email.toLowerCase()).maybeSingle()).data)
    : false;

  const name = profile.full_name || "";
  const initial = (name || user.email || "?").trim().charAt(0).toUpperCase();
  const saved = savedSlugs.map((slug) => getDistrict(slug)).filter((d): d is NonNullable<typeof d> => Boolean(d));
  const rtl = locale === "ar" || locale === "ur";
  const avg = saved.length ? Math.round(saved.reduce((s, d) => s + d.median.apartment, 0) / saved.length) : null;

  const nav = [
    { href: "#overview", Icon: IconGrid, label: t("overview") },
    { href: "#saved", Icon: IconMap, label: t("savedDistricts") },
    { href: "#profile", Icon: IconUser, label: t("profile") },
  ];
  const tools = [
    { href: "/districts", Icon: IconMap, label: n("productItems.districts.title") },
    { href: "/calculator", Icon: IconCalc, label: n("productItems.calculator.title") },
    { href: "/contact", Icon: IconChat, label: n("contact") },
  ];

  const kpis = [
    { label: t("savedDistricts"), value: fmtNumber(locale, saved.length), hint: null as string | null },
    { label: t("avgPrice"), value: avg ? fmtNumber(locale, avg) : "–", hint: avg ? c("perSqm") : null },
    { label: t("earlyAccess"), value: onWaitlist ? t("onList") : t("statusPending"), hint: null, tone: onWaitlist ? "ok" : "muted" },
    { label: t("memberSince"), value: fmtDate(locale, user.created_at), hint: null },
  ];

  return (
    <div className="border-t border-sand-200 bg-sand-50">
      <div className="container-x grid gap-8 py-8 lg:grid-cols-[220px_1fr] lg:py-10">
        {/* ───────── Sidebar ───────── */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center gap-3 rounded-xl border border-sand-200 bg-white p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-night-950 text-sm font-semibold text-white">{initial}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-900">{name || t("title")}</p>
              <p className="truncate text-xs text-ink-400" dir="ltr">{user.email}</p>
            </div>
          </div>
          <nav className="no-scrollbar mt-4 flex gap-1 overflow-x-auto lg:flex-col" aria-label={t("title")}>
            {nav.map(({ href, Icon, label }) => (
              <a key={href} href={href} className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-white hover:text-ink-900">
                <Icon width={16} height={16} className="text-ink-400" /> {label}
              </a>
            ))}
            <p className="mt-5 hidden px-3 pb-1 text-xs font-medium text-ink-400 lg:block">{t("quickLinks")}</p>
            {tools.map(({ href, Icon, label }) => (
              <Link key={href} href={href} className="hidden items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-500 transition hover:bg-white hover:text-ink-900 lg:flex">
                <Icon width={16} height={16} className="text-ink-400" /> {label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* ───────── Main ───────── */}
        <main className="min-w-0 space-y-6">
          <div id="overview" className="flex scroll-mt-28 flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm text-ink-500">{t("title")}</p>
              <h1 className="font-display mt-1 text-3xl text-ink-900">{name ? t("welcome", { name }) : t("welcomeNoName")}</h1>
            </div>
            <div className="flex gap-2">
              <Link href="/districts" className="btn btn-primary !py-2 text-sm">{t("browse")} <IconArrow width={15} height={15} className="flip-rtl" /></Link>
              <SignOutButton />
            </div>
          </div>

          {/* KPI row */}
          <div className="grid overflow-hidden rounded-xl border border-sand-200 bg-white sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((k, i) => (
              <div key={i} className="border-sand-200 p-5 [&:not(:last-child)]:border-b sm:[&:nth-child(odd)]:border-e xl:border-b-0 xl:[&:not(:last-child)]:border-e">
                <p className="text-xs font-medium text-ink-500">{k.label}</p>
                <p className={cn("mt-2 flex items-center gap-1.5 text-2xl font-semibold tracking-tight", k.tone === "ok" ? "text-emerald-700" : k.tone === "muted" ? "text-ink-400" : "text-ink-900")}>
                  {k.tone === "ok" && <IconCheck width={18} height={18} />}
                  <span dir={i < 2 ? "ltr" : undefined}>{k.value}</span>
                </p>
                {k.hint && <p className="mt-0.5 text-xs text-ink-400">{k.hint}</p>}
              </div>
            ))}
          </div>

          <div className="space-y-6">
            {/* Saved districts table */}
            <section id="saved" className="min-w-0 scroll-mt-28 overflow-hidden rounded-xl border border-sand-200 bg-white">
              <div className="flex items-center justify-between gap-4 border-b border-sand-200 px-5 py-4">
                <h2 className="text-sm font-semibold text-ink-900">{t("savedDistricts")}</h2>
                <Link href="/districts" className="text-sm font-medium text-green-600 hover:text-green-700">{t("browse")}</Link>
              </div>
              {saved.length === 0 ? (
                <div className="px-5 py-14 text-center">
                  <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl border border-sand-200 bg-sand-50 text-ink-400"><IconMap width={20} height={20} /></span>
                  <p className="mt-4 text-sm text-ink-500">{t("noSaved")}</p>
                  <Link href="/districts" className="btn btn-ghost mt-5 !py-2 text-sm">{t("browse")} <IconArrow width={15} height={15} className="flip-rtl" /></Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-sand-200 bg-sand-50 text-start text-xs font-medium text-ink-500">
                        <th className="px-5 py-2.5 text-start font-medium">{td("district")}</th>
                        <th className="px-3 py-2.5 text-start font-medium">{c("foreignZone")}</th>
                        <th className="px-3 py-2.5 text-end font-medium">{c("medianPrice")}</th>
                        <th className="px-3 py-2.5 text-end font-medium">{c("trend12m")}</th>
                        <th className="px-5 py-2.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand-200">
                      {saved.map((d) => {
                        const ch = trendChange(d);
                        return (
                          <tr key={d.slug} className="transition hover:bg-sand-50">
                            <td className="px-5 py-3">
                              <Link href={`/districts/${d.slug}`} className="font-medium text-ink-900 hover:text-green-600">{rtl ? d.nameAr : d.nameEn}</Link>
                              <p className="text-xs text-ink-400">{c(`city.${d.city}`)}</p>
                            </td>
                            <td className="px-3 py-3"><ZoneBadge status={d.zone} label={c(`zone.${d.zone}`)} /></td>
                            <td className="px-3 py-3 text-end tabular-nums text-ink-900" dir="ltr">{fmtNumber(locale, d.median.apartment)}</td>
                            <td className="px-3 py-3">
                              <div className="flex items-center justify-end gap-2">
                                <Sparkline id={`acc-${d.slug}`} values={d.trend} stroke={ch >= 0 ? "#047857" : "#b45309"} className="h-6 w-16" />
                                <span className={cn("w-14 text-end text-xs font-semibold tabular-nums", ch >= 0 ? "text-emerald-700" : "text-amber-700")} dir="ltr">{fmtPercent(locale, ch)}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-end"><SaveDistrictButton slug={d.slug} variant="light" /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <p className="border-t border-sand-200 px-5 py-2.5 text-xs text-ink-400">{c("sampleDataLong")}</p>
                </div>
              )}
            </section>

            {/* Side cards */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-sand-200 bg-white p-5">
                <div className="flex items-center gap-2">
                  <IconSpark width={16} height={16} className="text-green-600" />
                  <h2 className="text-sm font-semibold text-ink-900">{t("earlyAccess")}</h2>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{onWaitlist ? t("onWaitlist") : t("notOnWaitlist")}</p>
                {onWaitlist ? (
                  <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20"><IconCheck width={13} height={13} /> {t("onList")}</span>
                ) : (
                  <Link href="/waitlist" className="btn btn-primary mt-4 !py-2 text-sm">{t("joinWaitlist")}</Link>
                )}
              </div>

              <div className="rounded-xl bg-night-950 p-5 text-white">
                <div className="flex items-center gap-2">
                  <IconChat width={16} height={16} className="text-green-300" />
                  <h2 className="text-sm font-semibold">{t("advisorTitle")}</h2>
                  <span className="ms-auto rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/80">{c("comingSoon")}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{t("advisorBody")}</p>
              </div>
            </div>
          </div>

          {/* Profile */}
          <section id="profile" className="scroll-mt-28 rounded-xl border border-sand-200 bg-white">
            <div className="border-b border-sand-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-ink-900">{t("profile")}</h2>
              <p className="mt-0.5 text-sm text-ink-500">{t("profileSubtitle")}</p>
            </div>
            <div className="p-5 sm:p-6">
              <ProfileForm profile={profile} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
