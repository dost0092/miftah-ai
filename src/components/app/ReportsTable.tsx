"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { cn, fmtDate } from "@/lib/format";
import type { ReportType, UserReport } from "@/lib/workspace/store";
import { EmptyState } from "./ui";
import { IconExternal, IconPlus, IconReport, IconSearch, IconTrash } from "@/components/Icons";

const TYPES: ReportType[] = ["district", "due_diligence", "cost"];
const typeStyle: Record<ReportType, string> = {
  district: "bg-green-50 text-green-700",
  due_diligence: "bg-emerald-50 text-emerald-700",
  cost: "bg-sand-100 text-ink-700",
};

export function ReportsTable({ reports: initial }: { reports: UserReport[] }) {
  const t = useTranslations("app.reports");
  const locale = useLocale();
  const router = useRouter();
  const [reports, setReports] = useState(initial);
  const [tab, setTab] = useState<ReportType | "all">("all");
  const [q, setQ] = useState("");
  const shown = useMemo(
    () => reports.filter((r) => (tab === "all" || r.type === tab) && (!q || r.title.toLowerCase().includes(q.toLowerCase()))),
    [reports, tab, q],
  );

  async function remove(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    await fetch(`/api/app/reports/${id}`, { method: "DELETE" });
    setReports((rs) => rs.filter((r) => r.id !== id));
    router.refresh();
  }

  const count = (k: ReportType | "all") => (k === "all" ? reports.length : reports.filter((r) => r.type === k).length);

  return (
    <div className="rounded-2xl border border-sand-200 bg-white shadow-[0_1px_2px_rgb(11_13_18/.04)]">
      <div className="flex flex-col gap-4 border-b border-sand-200 p-5 sm:p-6">
        <label className="flex w-full max-w-md items-center gap-2 rounded-xl border border-sand-200 bg-sand-50 px-3 py-2 focus-within:border-green-500 focus-within:bg-white">
          <IconSearch width={16} height={16} className="text-ink-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-400" />
        </label>
        <nav className="no-scrollbar -mb-5 flex gap-1 overflow-x-auto sm:-mb-6">
          {(["all", ...TYPES] as const).map((k) => (
            <button key={k} type="button" onClick={() => setTab(k)} className={cn("-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 pb-3 text-sm font-medium transition", tab === k ? "border-green-600 text-green-700" : "border-transparent text-ink-500 hover:text-ink-900")}>
              {k === "all" ? t("all") : t(`type.${k}`)}
              <span className={cn("rounded-full px-1.5 py-0.5 text-[11px]", tab === k ? "bg-green-50" : "bg-sand-100")} dir="ltr">{count(k)}</span>
            </button>
          ))}
        </nav>
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={<IconReport width={22} height={22} />}
          title={t("empty")}
          body={t("emptyBody")}
          action={<Link href="/app/reports/new" className="btn btn-primary !py-2 text-sm"><IconPlus width={15} height={15} /> {t("create")}</Link>}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-sand-50 text-xs font-medium uppercase tracking-wide text-ink-500">
                <th className="w-12 px-5 py-3 text-start font-medium">#</th>
                <th className="px-3 py-3 text-start font-medium">{t("cols.title")}</th>
                <th className="px-3 py-3 text-start font-medium">{t("cols.type")}</th>
                <th className="px-3 py-3 text-start font-medium">{t("cols.date")}</th>
                <th className="px-5 py-3 text-end font-medium">{t("cols.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {shown.map((r, i) => (
                <tr key={r.id} className="transition hover:bg-sand-50/70">
                  <td className="px-5 py-3.5 tabular-nums text-ink-400" dir="ltr">{i + 1}</td>
                  <td className="px-3 py-3.5">
                    <Link href={`/app/reports/${r.id}`} className="font-medium text-green-700 underline-offset-2 hover:underline">{r.title}</Link>
                  </td>
                  <td className="px-3 py-3.5"><span className={cn("rounded-md px-2 py-1 text-xs font-medium", typeStyle[r.type])}>{t(`type.${r.type}`)}</span></td>
                  <td className="px-3 py-3.5 text-ink-700">{fmtDate(locale, r.created_at)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1">
                      <Link href={`/app/reports/${r.id}`} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-sand-100 hover:text-ink-900" title={t("open")} aria-label={t("open")}><IconExternal width={16} height={16} /></Link>
                      <button type="button" onClick={() => remove(r.id)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-sand-100 hover:text-ink-900" title={t("delete")} aria-label={t("delete")}><IconTrash width={16} height={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
