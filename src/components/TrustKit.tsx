import { useTranslations } from "next-intl";
import { cn } from "@/lib/format";
import { IconArrow } from "./Icons";

type Label = { id: "verified" | "review" | "sample" | "unknown"; title: string; body: string };
type Check = { title: string; body: string; url: string };

const labelStyle: Record<Label["id"], string> = {
  verified: "bg-green-50 text-green-800 ring-green-600/25",
  review: "bg-gold-100 text-gold-700 ring-gold-500/30",
  sample: "bg-sand-100 text-ink-700 ring-ink-400/30",
  unknown: "bg-white text-ink-500 ring-ink-400/30",
};

/** Explains the four labels used on every figure and rule across the site and in reports. */
export function FactLabels({ className, compact = false }: { className?: string; compact?: boolean }) {
  const t = useTranslations("trustKit");
  const labels = t.raw("labels") as Label[];
  return (
    <div className={cn("grid gap-3", compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4", className)}>
      {labels.map((l) => (
        <div key={l.id} className={cn("rounded-lg border border-sand-200 bg-white", compact ? "p-3" : "p-4")}>
          <span className={cn("inline-flex rounded px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset", labelStyle[l.id])}>{l.title}</span>
          <p className={cn("leading-relaxed text-ink-600", compact ? "mt-1.5 text-xs" : "mt-2 text-sm")}>{l.body}</p>
        </div>
      ))}
    </div>
  );
}

/** Official places where a buyer can check each point themselves. */
export function OfficialChecks({ className, compact = false }: { className?: string; compact?: boolean }) {
  const t = useTranslations("trustKit");
  const checks = t.raw("checks") as Check[];
  return (
    <ol className={cn("divide-y divide-sand-200 overflow-hidden rounded-lg border border-sand-200 bg-white", className)}>
      {checks.map((c, i) => (
        <li key={c.url + i} className={cn("flex items-start gap-4", compact ? "px-4 py-3" : "px-5 py-4")}>
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-green-600/30 text-xs font-semibold text-green-700" dir="ltr">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <p className={cn("font-semibold text-ink-900", compact && "text-sm")}>{c.title}</p>
            <p className={cn("mt-0.5 leading-relaxed text-ink-500", compact ? "text-xs" : "text-sm")}>{c.body}</p>
          </div>
          <a href={c.url} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 pt-0.5 text-xs font-semibold text-green-700 hover:underline" dir="ltr">
            {new URL(c.url).hostname.replace(/^www\./, "")} <IconArrow width={12} height={12} />
          </a>
        </li>
      ))}
    </ol>
  );
}

/** One-line "last reviewed" stamp with an invitation to report mistakes. */
export function ReviewedStamp({ date, className }: { date: string; className?: string }) {
  const t = useTranslations("trustKit");
  return (
    <p className={cn("text-xs text-ink-400", className)}>
      {t("reviewed", { date })} · <a href="mailto:hello@miftah.ai?subject=Correction" className="font-medium text-green-700 hover:underline">{t("reportMistake")}</a>
    </p>
  );
}
