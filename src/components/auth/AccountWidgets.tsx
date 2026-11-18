"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { localeNames, locales } from "@/i18n/routing";
import { getBrowserSupabase } from "@/lib/supabase-auth";
import { cn } from "@/lib/format";
import { saveProfile, savedFromUser, setSaved, type Profile } from "@/lib/account-store";
import type { User } from "@supabase/supabase-js";
import { IconCheck, IconPin } from "../Icons";

export type { Profile };

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const t = useTranslations("account");
  const w = useTranslations("waitlist");
  const a = useTranslations("auth");
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const supabase = getBrowserSupabase();
    if (!supabase) return setStatus("error");
    const fd = new FormData(e.currentTarget);
    setStatus("saving");
    const { ok } = await saveProfile(supabase, {
      full_name: String(fd.get("full_name") ?? "").trim() || null,
      nationality: String(fd.get("nationality") ?? "").trim() || null,
      city: String(fd.get("city") ?? "") || null,
      preferred_language: String(fd.get("preferred_language") ?? "") || null,
    });
    setStatus(ok ? "saved" : "error");
    if (ok) router.refresh();
  }

  const cities = ["riyadh", "jeddah", "makkah", "madinah", "other"] as const;
  return (
    <form onSubmit={onSubmit} className="space-y-4" onChange={() => status === "saved" && setStatus("idle")}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-ink-700">{a("name")}</span>
          <input name="full_name" defaultValue={profile?.full_name ?? ""} maxLength={120} className="input mt-2" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink-700">{w("nationality")}</span>
          <input name="nationality" defaultValue={profile?.nationality ?? ""} placeholder={w("nationalityPlaceholder")} maxLength={80} className="input mt-2" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink-700">{w("city")}</span>
          <select name="city" defaultValue={profile?.city ?? ""} className="input mt-2">
            <option value="">—</option>
            {cities.map((c) => <option key={c} value={c}>{w(`cityOptions.${c}`)}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink-700">{w("language")}</span>
          <select name="preferred_language" defaultValue={profile?.preferred_language ?? ""} className="input mt-2">
            <option value="">—</option>
            {locales.map((l) => <option key={l} value={l}>{localeNames[l].native}</option>)}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={status === "saving"} className="btn btn-primary disabled:opacity-60">
          {status === "saving" ? a("working") : t("save")}
        </button>
        {status === "saved" && <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700"><IconCheck width={16} height={16} /> {t("saved")}</span>}
        {status === "error" && <span className="text-sm text-ink-500">{a("errorGeneric")}</span>}
      </div>
    </form>
  );
}

export function SignOutButton({ className }: { className?: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  return (
    <button
      type="button"
      className={className ?? "btn btn-ghost !py-2 text-sm"}
      onClick={async () => {
        await getBrowserSupabase()?.auth.signOut();
        router.replace("/");
        router.refresh();
      }}
    >
      {t("signOut")}
    </button>
  );
}

/** Save / unsave a district for the signed-in user. Prompts sign-in otherwise. */
export function SaveDistrictButton({ slug, variant = "light" }: { slug: string; variant?: "dark" | "light" }) {
  const t = useTranslations("account");
  const router = useRouter();
  const locale = useLocale();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [saved, setSavedState] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return setUser(null);
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setSavedState(savedFromUser(data.user).includes(slug));
    });
  }, [slug]);

  const base = variant === "dark" ? "btn btn-ghost-dark !py-2.5 text-sm" : "btn btn-ghost !py-2 text-sm";

  if (user === null) {
    return (
      <Link href={{ pathname: "/login", query: { next: `/${locale}/districts/${slug}` } }} className={base}>
        <IconPin width={16} height={16} /> {t("signInToSave")}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={busy || user === undefined}
      className={cn(base, saved && (variant === "dark" ? "!border-white/40 !text-white" : "!border-green-600/40 !bg-green-50 !text-green-700"), "disabled:opacity-60")}
      onClick={async () => {
        const supabase = getBrowserSupabase();
        if (!supabase || !user) return;
        setBusy(true);
        const res = await setSaved(supabase, user, slug, !saved);
        if (res.ok) {
          setSavedState(!saved);
          setUser({ ...user, user_metadata: { ...user.user_metadata, saved_districts: res.list } });
        }
        setBusy(false);
        router.refresh();
      }}
    >
      {saved ? <IconCheck width={16} height={16} /> : <IconPin width={16} height={16} />}
      {saved ? (variant === "light" ? t("remove") : t("savedDistrict")) : t("saveDistrict")}
    </button>
  );
}
