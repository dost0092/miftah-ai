"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/format";
import { IconArrow, IconLock } from "@/components/Icons";

/** First day of next month (UTC), when the free allowance renews. */
export function nextReset(locale: string) {
  const d = new Date();
  const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(next);
}

type PaddleGlobal = {
  Environment: { set: (env: string) => void };
  Initialize: (opts: { token: string; eventCallback?: (e: { name?: string }) => void }) => void;
  Checkout: { open: (opts: Record<string, unknown>) => void };
};
declare global {
  interface Window {
    Paddle?: PaddleGlobal;
  }
}

let paddleReady: Promise<PaddleGlobal> | null = null;
let paddleToken: string | null = null;

/** Loads Paddle.js once and initialises it with the client token. */
function loadPaddle(token: string, environment: string, onComplete: () => void): Promise<PaddleGlobal> {
  paddleReady ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    s.async = true;
    s.onload = () => (window.Paddle ? resolve(window.Paddle) : reject(new Error("paddle")));
    s.onerror = () => {
      paddleReady = null;
      reject(new Error("paddle"));
    };
    document.head.appendChild(s);
  });
  return paddleReady.then((P) => {
    if (paddleToken !== token) {
      if (environment === "sandbox") P.Environment.set("sandbox");
      P.Initialize({ token, eventCallback: (e) => e.name === "checkout.completed" && onComplete() });
      paddleToken = token;
    }
    return P;
  });
}

const paddleLocale = (l: string) => (l === "ar" ? "ar" : l === "zh" ? "zh-Hans" : "en");

/** Opens Paddle's overlay checkout for Pro. */
async function openCheckout(locale: string): Promise<"ok" | "not_configured" | "error"> {
  const res = await fetch("/api/billing/checkout", { method: "POST" }).catch(() => null);
  if (!res) return "error";
  const cfg = await res.json().catch(() => ({}));
  if (!res.ok) return cfg.error === "not_configured" ? "not_configured" : "error";
  try {
    const successUrl = `${window.location.origin}/${locale}/app/billing?status=success`;
    const P = await loadPaddle(cfg.token, cfg.environment, () => window.setTimeout(() => window.location.assign(successUrl), 1500));
    P.Checkout.open({
      items: [{ priceId: cfg.priceId, quantity: 1 }],
      customer: cfg.email ? { email: cfg.email } : undefined,
      customData: { user_id: cfg.userId },
      settings: { displayMode: "overlay", theme: "light", locale: paddleLocale(locale), successUrl },
    });
    return "ok";
  } catch {
    return "error";
  }
}

async function openPortal(): Promise<"ok" | "error"> {
  const res = await fetch("/api/billing/portal", { method: "POST" }).catch(() => null);
  const data = res ? await res.json().catch(() => ({})) : {};
  if (res?.ok && data.url) {
    window.location.assign(data.url);
    return "ok";
  }
  return "error";
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
          const r = await openCheckout(locale);
          setState(r === "ok" ? "idle" : r);
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
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  return (
    <div>
      <button
        type="button"
        disabled={state === "busy"}
        onClick={async () => {
          setState("busy");
          const r = await openPortal();
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

/** After checkout, Paddle's webhook can lag a few seconds: refresh until the plan turns Pro. */
export function ActivationWatcher() {
  const t = useTranslations("app.billing");
  const router = useRouter();
  const [tries, setTries] = useState(0);
  useEffect(() => {
    if (tries >= 10) return;
    const id = window.setTimeout(() => {
      router.refresh();
      setTries((n) => n + 1);
    }, 3000);
    return () => window.clearTimeout(id);
  }, [tries, router]);
  return (
    <p className="mt-6 flex items-center gap-2.5 rounded-xl border border-green-600/15 bg-green-50 px-4 py-3 text-sm text-ink-700">
      <span className="h-2 w-2 animate-pulse-soft rounded-full bg-green-600" />
      {tries >= 10 ? t("activatingSlow") : t("activating")}
    </p>
  );
}
