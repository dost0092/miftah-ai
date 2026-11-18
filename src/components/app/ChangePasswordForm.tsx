"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-auth";

export function ChangePasswordForm() {
  const t = useTranslations("app.account");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const a = String(fd.get("password") ?? "");
    const b = String(fd.get("confirm") ?? "");
    if (a.length < 8) return setMsg({ ok: false, text: t("passwordShort") });
    if (a !== b) return setMsg({ ok: false, text: t("passwordMismatch") });
    const supabase = getBrowserSupabase();
    if (!supabase) return setMsg({ ok: false, text: t("passwordError") });
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: a });
    setBusy(false);
    if (error) return setMsg({ ok: false, text: t("passwordError") });
    form.reset();
    setMsg({ ok: true, text: t("passwordUpdated") });
  }

  return (
    <form onSubmit={submit} className="max-w-md space-y-4">
      <label className="block">
        <span className="text-sm font-semibold text-ink-700">{t("newPassword")}</span>
        <input name="password" type="password" autoComplete="new-password" minLength={8} required className="input mt-2" />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-ink-700">{t("confirmPassword")}</span>
        <input name="confirm" type="password" autoComplete="new-password" minLength={8} required className="input mt-2" />
      </label>
      {msg && <p className={msg.ok ? "text-sm text-emerald-700" : "text-sm text-red-600"}>{msg.text}</p>}
      <button type="submit" disabled={busy} className="btn btn-primary !py-2.5 text-sm disabled:opacity-60">{t("updatePassword")}</button>
    </form>
  );
}
