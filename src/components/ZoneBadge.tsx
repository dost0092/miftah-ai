import type { ZoneStatus } from "@/lib/districts";
import { cn } from "@/lib/format";

const styles: Record<ZoneStatus, string> = {
  yes: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  no: "bg-sand-100 text-ink-700 ring-sand-300",
  conditional: "bg-green-50 text-green-700 ring-green-600/20",
  unknown: "bg-sand-100 text-ink-500 ring-ink-400/25",
};
const dot: Record<ZoneStatus, string> = {
  yes: "bg-emerald-500",
  no: "bg-ink-400",
  conditional: "bg-green-500",
  unknown: "bg-ink-400",
};

export function ZoneBadge({ status, label, className }: { status: ZoneStatus; label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", styles[status], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot[status])} />
      {label}
    </span>
  );
}
