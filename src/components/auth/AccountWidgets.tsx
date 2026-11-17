"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { localeNames, locales } from "@/i18n/routing";
import { getBrowserSupabase } from "@/lib/supabase-auth";
import { cn } from "@/lib/format";
import { IconCheck, IconPin } from "../Icons";

export type Profile = { full_name: string | null; nationality: string | null; city: string | null; preferred_language: string | null };

export function ProfileForm({ userId, profile }: { userId: string; profile: Profile | null }) {
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
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: String(fd.get("full_name") ?? "").trim() || null,
      nationality: String(fd.get("nationality") ?? "").trim() || null,
      city: String(fd.get("city") ?? "") || null,
      preferred_language: String(fd.get("preferred_language") ?? "") || null,
      updated_at: new Date().toISOString(),
    });
    setStatus(error ? "error" : "saved");
    if (!error) router.refresh();
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
        <button type="submit" disabled={status === "saving"} className="btn btn-primary !rounded-xl disabled:opacity-60">
          {status === "saving" ? a("working") : t("save")}
        </button>
        {status === "saved" && <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700"><IconCheck width={16} height={16} /> {t("saved")}</span>}
        {status === "error" && <span className="text-sm text-red-600">{a("errorGeneric")}</span>}
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
      className={className ?? "btn btn-ghost-dark !py-2.5 text-sm"}
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
export function SaveDistrictButton({ slug, variant = "dark" }: { slug: string; variant?: "dark" | "light" }) {
  const t = useTranslations("account");
  const router = useRouter();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return setUserId(null);
    supabase.auth.getUser().then(async ({ data }) => {
      const id = data.user?.id ?? null;
      setUserId(id);
      if (id) {
        const { data: row } = await supabase.from("saved_districts").select("district_slug").eq("user_id", id).eq("district_slug", slug).maybeSingle();
        setSaved(Boolean(row));
      }
    });
  }, [slug]);

  const base = variant === "dark" ? "btn btn-ghost-dark !py-2.5 text-sm" : "btn btn-ghost !py-2 text-sm";

  if (userId === null) {
    return (
      <Link href={{ pathname: "/login", query: { next: `/${typeof window !== "undefined" ? window.location.pathname.split("/")[1] : "en"}/districts/${slug}` } }} className={base}>
        <IconPin width={16} height={16} /> {t("signInToSave")}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={busy || userId === undefined}
      className={cn(base, saved && (variant === "dark" ? "!border-gold-400/60 !text-gold-300" : "!border-green-600/40 !text-green-700"), "disabled:opacity-60")}
      onClick={async () => {
        const supabase = getBrowserSupabase();
        if (!supabase || !userId) return;
        setBusy(true);
        const { error } = saved
          ? await supabase.from("saved_districts").delete().eq("user_id", userId).eq("district_slug", slug)
          : await supabase.from("saved_districts").insert({ user_id: userId, district_slug: slug });
        if (!error) setSaved(!saved);
        setBusy(false);
        router.refresh();
      }}
    >
      {saved ? <IconCheck width={16} height={16} /> : <IconPin width={16} height={16} />}
      {saved ? (variant === "light" ? t("remove") : t("savedDistrict")) : t("saveDistrict")}
    </button>
  );
}
