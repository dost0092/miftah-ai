"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Link } from "@/i18n/navigation";
import { getBrowserSupabase } from "@/lib/supabase-auth";

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const supabase = getBrowserSupabase();
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    if (!supabase) return setStatus("error");
    setStatus("loading");
    const { error } = await supabase.auth.updateUser({ password });
    setStatus(error ? "error" : "done");
  }

  return (
    <div className="w-full">
      <h1 className="font-display text-4xl leading-tight">{t("resetTitle")}</h1>
      {status === "done" ? (
        <div className="mt-8 space-y-4">
          <p className="rounded-2xl border border-green-600/20 bg-green-50 p-5 text-green-800">{t("passwordUpdated")}</p>
          <Link href="/account" className="btn btn-primary w-full !rounded-xl">{t("account")}</Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-ink-700">{t("newPassword")}</span>
            <input name="password" type="password" required minLength={8} autoComplete="new-password" dir="ltr" className="input mt-2" />
            <span className="mt-1.5 block text-xs text-ink-400">{t("passwordHint")}</span>
          </label>
          {status === "error" && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{t("errorLink")}</p>}
          <button type="submit" disabled={status === "loading"} className="btn btn-primary w-full !rounded-xl !py-3.5 disabled:opacity-60">
            {status === "loading" ? t("working") : t("savePassword")}
          </button>
        </form>
      )}
    </div>
  );
}
