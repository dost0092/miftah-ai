"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/format";
import { IconArrow, IconLock } from "@/components/Icons";

/** First day of next month (UTC), when the free allowance renews. */
export function nextReset(locale: string) {
  const d = new Date();
  const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(next);
}

async function openStripe(path: "/api/billing/checkout" | "/api/billing/portal", locale: string): Promise<"ok" | "not_configured" | "error"> {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale }) }).catch(() => null);
  if (!res) return "error";
  const data = await res.json().catch(() => ({}));
  if (res.ok && data.url) {
    window.location.assign(data.url);
    return "ok";
  }
  return data.error === "not_configured" ? "not_configured" : "error";
}

export function UpgradeButton({ className, label }: { className?: string; label?: string }) {
  const t = useTranslations("app.billing");
  const locale = useLocale();
  const [state, setState] = useState<"idle" | "busy" | "not_configured" | "error">("idle");
  return (
    <div>
      <button
        type="button"
        disabled={state === "busy"}
        onClick={async () => {
          setState("busy");
          const r = await openStripe("/api/billing/checkout", locale);
          if (r !== "ok") setState(r);
        }}
        className={cn("btn btn-primary disabled:opacity-70", className)}
      >
        {state === "busy" ? t("redirecting") : (label ?? t("upgrade"))}
        {state !== "busy" && <IconArrow width={16} height={16} className="flip-rtl" />}
      </button>
      {state === "not_configured" && (
        <p className="mt-3 text-sm opacity-75">
          {t("notConfigured")}{" "}
          <Link href="/contact" className="font-medium underline underline-offset-2">{t("contact")}</Link>
        </p>
      )}
      {state === "error" && <p className="mt-3 text-sm opacity-75">{t("error")}</p>}
    </div>
  );
}

export function ManageBillingButton() {
  const t = useTranslations("app.billing");
  const locale = useLocale();
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  return (
    <div>
      <button
        type="button"
        disabled={state === "busy"}
        onClick={async () => {
          setState("busy");
          const r = await openStripe("/api/billing/portal", locale);
          if (r !== "ok") setState("error");
        }}
        className="btn btn-ghost disabled:opacity-70"
      >
        {state === "busy" ? t("redirecting") : t("manage")}
      </button>
      {state === "error" && <p className="mt-3 text-sm opacity-75">{t("error")}</p>}
    </div>
  );
}

/** Calm notice shown when the free monthly allowance is used up. */
export function UpgradeNotice({ kind, limit, className }: { kind: "chat" | "report"; limit: number; className?: string }) {
  const t = useTranslations("app.billing");
  const locale = useLocale();
  return (
    <div className={cn("rounded-2xl border border-green-600/15 bg-gradient-to-b from-green-50 to-white p-5 sm:p-6", className)}>
      <div className="flex items-start gap-3.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-night-950 text-white"><IconLock width={16} height={16} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-ink-900">{kind === "chat" ? t("limitChatTitle", { limit }) : t("limitReportTitle")}</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-500">{t("limitBody", { date: nextReset(locale) })}</p>
          <div className="mt-4 flex flex-wrap items-start gap-2">
            <UpgradeButton className="!py-2 text-sm" label={`${t("upgrade")} · ${t("price")}`} />
            <Link href="/app/billing" className="btn btn-ghost !py-2 text-sm">{t("seePlans")}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
