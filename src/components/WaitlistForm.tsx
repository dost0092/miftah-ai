"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { localeNames, locales } from "@/i18n/routing";
import { IconCheck, IconSpark } from "./Icons";
import { LogoMark } from "./Logo";

type Status = "idle" | "loading" | "success" | "error";

export function WaitlistForm() {
  const t = useTranslations("waitlist");
  const f = useTranslations("footer");
  const locale = useLocale();
  const params = useSearchParams();
  const question = params.get("q") ?? "";
  const [status, setStatus] = useState<Status>("idle");
  const [emailError, setEmailError] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(true);
      return;
    }
    setEmailError(false);
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          nationality: fd.get("nationality"),
          city: fd.get("city"),
          role: fd.get("role"),
          language: fd.get("language"),
          question,
          consent: fd.get("consent") === "on",
          website: fd.get("website") ?? "",
        }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="card p-10 text-center">
        <LogoMark className="mx-auto h-14 w-14" />
        <h2 className="font-display mt-6 text-3xl">{t("successTitle")}</h2>
        <p className="mt-3 text-ink-500">{t("successBody")}</p>
      </div>
    );
  }

  const cityOptions = ["riyadh", "jeddah", "makkah", "madinah", "other"] as const;
  const roleOptions = ["expat", "investor", "broker", "business", "other"] as const;

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-6 sm:p-8" noValidate>
      {question && (
        <div className="flex items-start gap-3 rounded-2xl bg-green-50 p-4 text-sm text-green-800">
          <IconSpark width={18} height={18} className="mt-0.5 shrink-0" />
          <p>&ldquo;{question}&rdquo;</p>
        </div>
      )}
      <div>
        <label htmlFor="email" className="text-sm font-semibold text-ink-700">{t("email")}</label>
        <input id="email" name="email" type="email" required autoComplete="email" dir="ltr" className="input mt-2" placeholder="you@example.com" aria-invalid={emailError} />
        {emailError && <p className="mt-1.5 text-sm text-red-600">{t("invalidEmail")}</p>}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="nationality" className="text-sm font-semibold text-ink-700">{t("nationality")}</label>
          <input id="nationality" name="nationality" className="input mt-2" placeholder={t("nationalityPlaceholder")} maxLength={80} />
        </div>
        <div>
          <label htmlFor="city" className="text-sm font-semibold text-ink-700">{t("city")}</label>
          <select id="city" name="city" className="input mt-2" defaultValue="riyadh">
            {cityOptions.map((o) => <option key={o} value={o}>{t(`cityOptions.${o}`)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="role" className="text-sm font-semibold text-ink-700">{t("role")}</label>
          <select id="role" name="role" className="input mt-2" defaultValue="expat">
            {roleOptions.map((o) => <option key={o} value={o}>{t(`roleOptions.${o}`)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="language" className="text-sm font-semibold text-ink-700">{t("language")}</label>
          <select id="language" name="language" className="input mt-2" defaultValue={locale}>
            {locales.map((l) => <option key={l} value={l}>{localeNames[l].native}</option>)}
          </select>
        </div>
      </div>
      {/* honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label className="flex items-start gap-3 text-sm text-ink-500">
        <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 accent-green-600" />
        <span>
          {t("consent")}{" "}
          <Link href="/legal/privacy" className="font-semibold text-green-700 underline-offset-2 hover:underline">{f("privacy")}</Link>
        </span>
      </label>
      <button type="submit" disabled={status === "loading"} className="btn btn-primary w-full !py-3.5 disabled:opacity-60">
        {status === "loading" ? t("submitting") : t("submit")}
        {status !== "loading" && <IconCheck width={16} height={16} />}
      </button>
      {status === "error" && <p className="text-center text-sm text-red-600">{t("error")}</p>}
    </form>
  );
}
