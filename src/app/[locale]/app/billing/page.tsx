import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAppSession } from "@/lib/workspace/session";
import { FREE_LIMITS, getAllowance, monthStart } from "@/lib/billing";
import { PageHeader, Panel } from "@/components/app/ui";
import { ActivationWatcher, ManageBillingButton, UpgradeButton } from "@/components/app/billing";
import { IconCheck } from "@/components/Icons";
import { cn, fmtNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ status?: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.billing" });
  return { title: t("title") };
}

function Meter({ label, used, limit, unlimited, locale }: { label: string; used: number; limit: number | null; unlimited: string; locale: string }) {
  const pct = limit ? Math.min(100, (used / limit) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-ink-900">{label}</span>
        <span className="tabular-nums text-ink-500" dir="ltr">
          {limit ? `${fmtNumber(locale, used)} / ${fmtNumber(locale, limit)}` : `${fmtNumber(locale, used)} · ${unlimited}`}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand-100">
        <div className={cn("h-full rounded-full transition-all", limit ? "bg-green-600" : "bg-emerald-500")} style={{ width: limit ? `${pct}%` : "100%" }} />
      </div>
    </div>
  );
}

export default async function BillingPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { status } = await searchParams;
  const t = await getTranslations("app.billing");
  const session = (await getAppSession())!;
  const a = await getAllowance(session);
  const pro = a.plan.plan === "pro";
  const date = (iso: string | Date) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso));
  const start = monthStart();
  const reset = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));

  return (
    <div className="min-h-full bg-sand-50/60">
      <div className="mx-auto max-w-5xl px-4 pb-14 pt-8 sm:px-6 lg:pt-10">
        <PageHeader title={t("title")} subtitle={t("subtitle")} />

        {status === "success" && (pro ? <p className="mt-6 rounded-xl border border-emerald-600/15 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{t("success")}</p> : <ActivationWatcher />)}
        {status === "cancelled" && <p className="mt-6 rounded-xl border border-sand-200 bg-white px-4 py-3 text-sm text-ink-500">{t("cancelled")}</p>}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-6">
            <Panel title={t("currentPlan")}>
              <div className="flex items-center gap-3">
                <span className={cn("rounded-full px-3 py-1 text-sm font-semibold", pro ? "bg-night-950 text-white" : "bg-sand-100 text-ink-900")}>{pro ? t("proName") : t("free")}</span>
                {pro && a.plan.renewsAt && (
                  <span className="text-sm text-ink-500">{a.plan.cancelAtPeriodEnd ? t("ends", { date: date(a.plan.renewsAt) }) : t("renews", { date: date(a.plan.renewsAt) })}</span>
                )}
              </div>
              {pro && (
                <div className="mt-5">
                  <ManageBillingButton />
                </div>
              )}
            </Panel>

            <Panel title={t("usage")} action={!pro ? <span className="text-xs text-ink-400">{t("resets", { date: date(reset) })}</span> : undefined}>
              <div className="space-y-5">
                <Meter label={t("questions")} used={a.used.chat} limit={pro ? null : FREE_LIMITS.chat} unlimited={t("unlimited")} locale={locale} />
                <Meter label={t("reports")} used={a.used.report} limit={pro ? null : FREE_LIMITS.report} unlimited={t("unlimited")} locale={locale} />
              </div>
            </Panel>
          </div>

          <section className="relative overflow-hidden rounded-2xl bg-night-950 p-7 text-white sm:p-8">
            <div className="pointer-events-none absolute -end-24 -top-24 h-72 w-72 rounded-full bg-green-600/30 blur-3xl" aria-hidden />
            <div className="relative">
              <p className="text-sm font-medium text-green-300">{t("proName")}</p>
              <p className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-[-0.03em]">{t("price")}</span>
                <span className="text-sm text-white/55">{t("perMonth")}</span>
              </p>
              <ul className="mt-6 space-y-3">
                {(t.raw("proFeatures") as string[]).map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white/85">
                    <IconCheck width={16} height={16} className="mt-0.5 shrink-0 text-green-300" /> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-7">
                {pro ? (
                  <p className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3.5 py-2 text-sm font-medium ring-1 ring-inset ring-white/15">
                    <IconCheck width={15} height={15} className="text-emerald-300" /> {t("currentPlan")}
                  </p>
                ) : (
                  <UpgradeButton className="!bg-white !text-ink-900 hover:!bg-sand-100" />
                )}
              </div>
              <p className="mt-5 text-xs leading-relaxed text-white/45">{t("billedNote")}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
