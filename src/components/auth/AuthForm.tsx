"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { getBrowserSupabase } from "@/lib/supabase-auth";
import { IconArrow } from "../Icons";

type Mode = "login" | "signup" | "forgot";
type Status = { kind: "idle" | "loading" | "error" | "success"; message?: string };

const googleEnabled = process.env.NEXT_PUBLIC_AUTH_GOOGLE === "true";

export function AuthForm({ mode }: { mode: Mode }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const linkError = params.get("error") === "link";
  const nextPath = safeNext(params.get("next"), locale);
  const [status, setStatus] = useState<Status>(linkError ? { kind: "error", message: t("errorLink") } : { kind: "idle" });

  const supabase = getBrowserSupabase();
  const callback = (next: string, extra = "") =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}${extra}`;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) return setStatus({ kind: "error", message: t("notConfigured") });
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    setStatus({ kind: "loading" });

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return setStatus({ kind: "error", message: /invalid/i.test(error.message) ? t("errorInvalid") : /confirm/i.test(error.message) ? t("errorUnconfirmed") : t("errorGeneric") });
      router.replace(nextPath.replace(`/${locale}`, "") || "/account");
      router.refresh();
      return;
    }

    if (mode === "signup") {
      const full_name = String(fd.get("name") ?? "").trim();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name, preferred_language: locale },
          emailRedirectTo: callback(`/${locale}/account`, "&new=1"),
        },
      });
      if (error) return setStatus({ kind: "error", message: /registered|exists/i.test(error.message) ? t("errorExists") : /password/i.test(error.message) ? t("passwordHint") : t("errorGeneric") });
      if (data.session) {
        await fetch("/api/account/created", { method: "POST" }).catch(() => {});
        router.replace("/account");
        router.refresh();
        return;
      }
      return setStatus({ kind: "success", message: t("checkEmail") });
    }

    // forgot password
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: callback(`/${locale}/reset-password`) });
    setStatus({ kind: "success", message: t("resetSent") });
  }

  async function google() {
    if (!supabase) return setStatus({ kind: "error", message: t("notConfigured") });
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback(nextPath) } });
  }

  const title = mode === "login" ? t("loginTitle") : mode === "signup" ? t("signupTitle") : t("forgotTitle");
  const subtitle = mode === "login" ? t("loginSubtitle") : mode === "signup" ? t("signupSubtitle") : t("forgotSubtitle");
  const loading = status.kind === "loading";

  return (
    <div className="w-full">
      <h1 className="font-display text-4xl leading-tight">{title}</h1>
      <p className="mt-2 text-ink-500">{subtitle}</p>

      {googleEnabled && mode !== "forgot" && (
        <>
          <button type="button" onClick={google} className="btn btn-ghost mt-8 w-full !rounded-xl !py-3">
            <GoogleIcon /> {t("google")}
          </button>
          <div className="my-6 flex items-center gap-3 text-xs text-ink-400">
            <span className="h-px flex-1 bg-sand-200" /> {t("or")} <span className="h-px flex-1 bg-sand-200" />
          </div>
        </>
      )}

      {status.kind === "success" ? (
        <div className="mt-8 rounded-2xl border border-green-600/20 bg-green-50 p-5 text-green-800">{status.message}</div>
      ) : (
        <form onSubmit={onSubmit} className={googleEnabled && mode !== "forgot" ? "space-y-4" : "mt-8 space-y-4"}>
          {mode === "signup" && (
            <Field label={t("name")}>
              <input name="name" required maxLength={120} autoComplete="name" className="input" />
            </Field>
          )}
          <Field label={t("email")}>
            <input name="email" type="email" required autoComplete="email" dir="ltr" className="input" placeholder="you@example.com" />
          </Field>
          {mode !== "forgot" && (
            <Field
              label={t("password")}
              aside={mode === "login" ? <Link href="/forgot-password" className="text-sm font-semibold text-green-700 hover:underline">{t("forgot")}</Link> : undefined}
              hint={mode === "signup" ? t("passwordHint") : undefined}
            >
              <input name="password" type="password" required minLength={mode === "signup" ? 8 : 1} autoComplete={mode === "signup" ? "new-password" : "current-password"} dir="ltr" className="input" />
            </Field>
          )}

          {status.kind === "error" && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{status.message}</p>}

          <button type="submit" disabled={loading} className="btn btn-primary w-full !rounded-xl !py-3.5 disabled:opacity-60">
            {loading ? t("working") : mode === "login" ? t("signIn") : mode === "signup" ? t("signUp") : t("sendLink")}
            {!loading && <IconArrow width={16} height={16} />}
          </button>
          {mode === "signup" && <p className="text-center text-xs text-ink-400">{t("terms")}</p>}
        </form>
      )}

      <p className="mt-8 text-center text-sm text-ink-500">
        {mode === "login" ? (
          <>{t("noAccount")} <Link href="/signup" className="font-semibold text-green-700 hover:underline">{t("createOne")}</Link></>
        ) : (
          <>{t("haveAccount")} <Link href="/login" className="font-semibold text-green-700 hover:underline">{t("signIn")}</Link></>
        )}
      </p>
    </div>
  );
}

function safeNext(next: string | null, locale: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : `/${locale}/account`;
}

function Field({ label, children, aside, hint }: { label: string; children: React.ReactNode; aside?: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink-700">{label}</span>
        {aside}
      </span>
      <span className="mt-2 block">{children}</span>
      {hint && <span className="mt-1.5 block text-xs text-ink-400">{hint}</span>}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
