import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createCookieSupabase } from "@/lib/supabase-auth";
import { getServerSupabase } from "@/lib/supabase";
import { getDistrict, trendChange } from "@/lib/districts";
import { cn, fmtDate, fmtNumber, fmtPercent } from "@/lib/format";
import { ProfileForm, SaveDistrictButton, SignOutButton } from "@/components/auth/AccountWidgets";
import { profileFromUser, savedFromUser } from "@/lib/account-store";
import { IconArrow, IconCalc, IconChat, IconCheck, IconMap, IconSpark, IconUser } from "@/components/Icons";

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
  const saved = savedSlugs.map((slug) => getDistrict(slug)).filter((d): d is NonNullable<typeof d> => Boolean(d));
  const rtl = locale === "ar" || locale === "ur";

  return (
    <>
      <section className="bg-hero relative overflow-hidden text-white">
        <div className="sadu-pattern pointer-events-none absolute inset-0" />
        <div className="container-x relative flex flex-col justify-between gap-6 py-14 sm:flex-row sm:items-end">
          <div className="hero-in flex items-center gap-5">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gold-400 text-2xl font-bold text-night-950">
              {(name || user.email || "?").trim().charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="text-sm text-gold-300">{t("title")}</p>
              <h1 className="font-display mt-1 text-3xl sm:text-4xl">{name ? t("welcome", { name }) : t("welcomeNoName")}</h1>
              <p className="mt-1 text-sm text-white/60" dir="ltr">{user.email} · {t("memberSince")} {fmtDate(locale, user.created_at)}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
        <div className="sadu-band opacity-70" />
      </section>

      <section className="container-x grid gap-6 py-12 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="card p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <IconUser width={18} height={18} className="text-green-600" />
              <h2 className="text-lg font-semibold">{t("profile")}</h2>
            </div>
            <p className="mt-1 text-sm text-ink-500">{t("profileSubtitle")}</p>
            <div className="mt-6">
              <ProfileForm profile={profile} />
            </div>
          </div>

          <div className="card p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <IconMap width={18} height={18} className="text-green-600" />
                <h2 className="text-lg font-semibold">{t("savedDistricts")}</h2>
              </div>
              <Link href="/districts" className="text-sm font-semibold text-green-700 hover:underline">{t("browse")}</Link>
            </div>
            {saved.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-sand-300 p-8 text-center">
                <p className="text-ink-500">{t("noSaved")}</p>
                <Link href="/districts" className="btn btn-primary mt-4 !rounded-xl">{t("browse")} <IconArrow width={16} height={16} /></Link>
              </div>
            ) : (
              <ul className="mt-6 divide-y divide-sand-100">
                {saved.map((d) => {
                  const ch = trendChange(d);
                  return (
                    <li key={d.slug} className="flex items-center justify-between gap-4 py-4">
                      <Link href={`/districts/${d.slug}`} className="min-w-0">
                        <p className="font-semibold text-ink-900">{rtl ? d.nameAr : d.nameEn}</p>
                        <p className="text-xs text-ink-400">
                          {c(`city.${d.city}`)} · <span dir="ltr">{fmtNumber(locale, d.median.apartment)}</span> {c("perSqm")} ·{" "}
                          <span dir="ltr" className={cn("font-semibold", ch >= 0 ? "text-green-700" : "text-amber-700")}>{fmtPercent(locale, ch)}</span>
                        </p>
                      </Link>
                      <SaveDistrictButton slug={d.slug} variant="light" />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className={cn("rounded-[1.25rem] p-6", onWaitlist ? "bg-night-800 text-white" : "card")}>
            <div className="flex items-center gap-2">
              <IconSpark width={18} height={18} className={onWaitlist ? "text-gold-300" : "text-green-600"} />
              <h2 className="font-semibold">{t("earlyAccess")}</h2>
            </div>
            <p className={cn("mt-3 text-sm leading-relaxed", onWaitlist ? "text-white/80" : "text-ink-500")}>
              {onWaitlist ? t("onWaitlist") : t("notOnWaitlist")}
            </p>
            {onWaitlist ? (
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gold-400 px-3 py-1 text-xs font-bold text-night-950"><IconCheck width={13} height={13} /> {t("onList")}</span>
            ) : (
              <Link href="/waitlist" className="btn btn-primary mt-4 !rounded-xl text-sm">{t("joinWaitlist")}</Link>
            )}
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2">
              <IconChat width={18} height={18} className="text-green-600" />
              <h2 className="font-semibold">{t("advisorTitle")}</h2>
              <span className="ms-auto rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-semibold text-gold-700">{c("comingSoon")}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">{t("advisorBody")}</p>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold">{t("quickLinks")}</h2>
            <ul className="mt-3 space-y-1">
              {[
                { href: "/districts", Icon: IconMap, label: (await getTranslations("nav"))("productItems.districts.title") },
                { href: "/calculator", Icon: IconCalc, label: (await getTranslations("nav"))("productItems.calculator.title") },
                { href: "/contact", Icon: IconChat, label: (await getTranslations("nav"))("contact") },
              ].map(({ href, Icon, label }) => (
                <li key={href}>
                  <Link href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-sand-100">
                    <Icon width={16} height={16} className="text-green-600" /> {label}
                    <IconArrow width={14} height={14} className="ms-auto text-ink-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </>
  );
}
