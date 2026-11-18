import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAppSession } from "@/lib/workspace/session";
import { getAllowance } from "@/lib/billing";
import { activityByDay, activityCounts, recentActivity, type ActivityKind } from "@/lib/workspace/store";
import { savedFromUser } from "@/lib/account-store";
import { getDistrict } from "@/lib/districts";
import { fmtDate, fmtNumber, fmtRelative } from "@/lib/format";
import { EmptyState, PageHeader, Panel } from "@/components/app/ui";
import { ProfileForm, SaveDistrictButton } from "@/components/auth/AccountWidgets";
import { ChangePasswordForm } from "@/components/app/ChangePasswordForm";
import { IconBriefcase, IconCalc, IconChat, IconLock, IconMap, IconReport, IconSearch, IconTrend, IconUser } from "@/components/Icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.nav" });
  return { title: t("account") };
}

const kindIcon: Record<ActivityKind, typeof IconChat> = { chat: IconChat, map_view: IconMap, search: IconSearch, report: IconReport, calc: IconCalc };

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("app.account");
  const td = await getTranslations("app.dashboard");
  const tc = await getTranslations("common");
  const session = (await getAppSession())!;
  const rtl = locale === "ar" || locale === "ur";
  const [counts, days, history, allowance] = await Promise.all([activityCounts(session), activityByDay(session, 14), recentActivity(session, 25), getAllowance(session)]);
  const tb = await getTranslations("app.billing");
  const saved = savedFromUser(session.user).map(getDistrict).filter((d): d is NonNullable<typeof d> => Boolean(d));
  const maxDay = Math.max(1, ...days.map((d) => d.count));

  const sections = [
    { id: "profile", Icon: IconUser },
    { id: "usage", Icon: IconTrend },
    { id: "plan", Icon: IconBriefcase },
    { id: "security", Icon: IconLock },
    { id: "saved", Icon: IconMap },
  ] as const;

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[220px_1fr] lg:py-10">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl border border-sand-200 bg-white p-4">
          <p className="truncate text-sm font-semibold text-ink-900">{session.profile.full_name || t("title")}</p>
          <p className="truncate text-xs text-ink-400" dir="ltr">{session.user.email}</p>
          <p className="mt-3 text-[11px] text-ink-400">{t("memberSince")} {fmtDate(locale, session.user.created_at)}</p>
        </div>
        <nav className="no-scrollbar mt-3 flex gap-1 overflow-x-auto lg:flex-col">
          {sections.map(({ id, Icon }) => (
            <a key={id} href={`#${id}`} className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-sand-100 hover:text-ink-900">
              <Icon width={16} height={16} className="text-ink-400" /> {t(`sections.${id}`)}
            </a>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 space-y-6">
        <PageHeader title={t("title")} />

        <div id="profile" className="scroll-mt-6">
          <Panel title={t("sections.profile")}>
            <ProfileForm profile={session.profile} />
          </Panel>
        </div>

        <div id="usage" className="scroll-mt-6">
          <Panel title={t("sections.usage")}>
            <p className="-mt-1 text-sm text-ink-500">{t("usageSubtitle")}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {(Object.keys(kindIcon) as ActivityKind[]).map((k) => {
                const Icon = kindIcon[k];
                return (
                  <div key={k} className="rounded-xl border border-sand-200 p-3">
                    <Icon width={16} height={16} className="text-green-600" />
                    <p className="mt-2 text-xl font-semibold text-ink-900" dir="ltr">{fmtNumber(locale, counts[k])}</p>
                    <p className="text-[11px] text-ink-500">{td(`kind.${k}`)}</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-6 text-xs font-medium text-ink-500">{t("last14")}</p>
            <div className="mt-3 flex h-28 items-end gap-1.5" dir="ltr" role="img" aria-label={t("last14")}>
              {days.map((d) => (
                <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end">
                  <div className="w-full rounded-t-md bg-green-600/85 transition group-hover:bg-green-700" style={{ height: `${Math.max(d.count ? 6 : 2, (d.count / maxDay) * 100)}%`, opacity: d.count ? 1 : 0.18 }} />
                  <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-night-950 px-1.5 py-0.5 text-[10px] text-white group-hover:block">{d.count}</span>
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-ink-400" dir="ltr">
              <span>{fmtDate(locale, days[0].day)}</span>
              <span>{fmtDate(locale, days[days.length - 1].day)}</span>
            </div>

            <p className="mt-6 text-xs font-medium text-ink-500">{t("history")}</p>
            {history.length === 0 ? (
              <p className="mt-2 text-sm text-ink-400">{t("historyEmpty")}</p>
            ) : (
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <tbody className="divide-y divide-sand-200">
                    {history.map((a) => (
                      <tr key={a.id}>
                        <td className="w-36 py-2.5 text-xs text-green-700">{td(`kind.${a.kind}`)}</td>
                        <td className="py-2.5"><Link href={a.href ?? "/app"} className="text-ink-900 hover:text-green-700">{a.title}</Link></td>
                        <td className="w-32 py-2.5 text-end text-xs text-ink-400">{fmtRelative(locale, a.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>

        <div id="plan" className="scroll-mt-6">
          <Panel title={t("sections.plan")}>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-sand-50 p-4">
              <div>
                <span className="rounded-full bg-night-950 px-2.5 py-1 text-xs font-semibold text-white">{allowance.plan.plan === "pro" ? tb("proName") : tb("planBadge", { plan: tb("free") })}</span>
                <p className="mt-2 max-w-md text-sm text-ink-600">
                  {allowance.limits ? `${tb("questions")}: ${fmtNumber(locale, allowance.used.chat)} / ${fmtNumber(locale, allowance.limits.chat)} · ${tb("reports")}: ${fmtNumber(locale, allowance.used.report)} / ${fmtNumber(locale, allowance.limits.report)}` : tb("proFeatures.0")}
                </p>
              </div>
              <Link href="/app/billing" className="btn btn-ghost !py-2 text-sm">{allowance.plan.plan === "pro" ? tb("manage") : tb("upgrade")}</Link>
            </div>
          </Panel>
        </div>

        <div id="security" className="scroll-mt-6">
          <Panel title={t("securityTitle")}>
            {session.preview ? <p className="text-sm text-ink-500">{tc("comingSoon")}</p> : <ChangePasswordForm />}
          </Panel>
        </div>

        <div id="saved" className="scroll-mt-6">
          <Panel title={t("sections.saved")} bodyClass="!px-2 sm:!px-3">
            {saved.length === 0 ? (
              <EmptyState icon={<IconMap width={22} height={22} />} title={td("savedEmpty")} action={<Link href="/app/map" className="btn btn-ghost !py-2 text-sm">{td("openMap")}</Link>} />
            ) : (
              <ul className="divide-y divide-sand-200">
                {saved.map((d) => (
                  <li key={d.slug} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <Link href={`/app/map?d=${d.slug}`} className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink-900">{rtl ? d.nameAr : d.nameEn}</span>
                      <span className="text-xs text-ink-400">{tc(`city.${d.city}`)}</span>
                    </Link>
                    <SaveDistrictButton slug={d.slug} variant="light" />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
