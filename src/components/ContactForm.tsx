"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { IconArrow, IconCheck } from "./Icons";

type Status = "idle" | "loading" | "success" | "error";
const topics = ["general", "broker", "data", "press", "other"] as const;

export function ContactForm() {
  const t = useTranslations("contact");
  const locale = useLocale();
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const fd = new FormData(form);
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(fd.entries()), language: locale }),
      });
      setStatus(res.ok ? "success" : "error");
      if (res.ok) form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="card flex flex-col items-center p-10 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-green-600 text-white"><IconCheck /></span>
        <p className="mt-5 max-w-sm text-lg text-ink-700">{t("success")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-sm font-semibold text-ink-700">{t("name")}</label>
          <input id="name" name="name" required maxLength={120} autoComplete="name" className="input mt-2" />
        </div>
        <div>
          <label htmlFor="c-email" className="text-sm font-semibold text-ink-700">{t("email")}</label>
          <input id="c-email" name="email" type="email" required autoComplete="email" dir="ltr" className="input mt-2" />
        </div>
        <div>
          <label htmlFor="company" className="text-sm font-semibold text-ink-700">{t("company")}</label>
          <input id="company" name="company" maxLength={160} autoComplete="organization" className="input mt-2" />
        </div>
        <div>
          <label htmlFor="topic" className="text-sm font-semibold text-ink-700">{t("topic")}</label>
          <select id="topic" name="topic" className="input mt-2" defaultValue="general">
            {topics.map((o) => <option key={o} value={o}>{t(`topics.${o}`)}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="message" className="text-sm font-semibold text-ink-700">{t("message")}</label>
        <textarea id="message" name="message" required minLength={5} maxLength={4000} rows={5} className="input mt-2 resize-y" />
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <button type="submit" disabled={status === "loading"} className="btn btn-primary w-full !py-3.5 disabled:opacity-60 sm:w-auto">
        {status === "loading" ? t("sending") : t("send")}
        {status !== "loading" && <IconArrow width={16} height={16} />}
      </button>
      {status === "error" && <p className="text-sm text-red-600">{t("error")}</p>}
    </form>
  );
}
