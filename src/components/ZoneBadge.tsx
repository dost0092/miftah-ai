import type { ZoneStatus } from "@/lib/districts";
import { cn } from "@/lib/format";

const styles: Record<ZoneStatus, string> = {
  yes: "bg-green-50 text-green-700 ring-green-600/20",
  no: "bg-red-50 text-red-700 ring-red-600/20",
  conditional: "bg-gold-100 text-gold-700 ring-gold-500/30",
  unknown: "bg-sand-100 text-ink-500 ring-ink-400/25",
};
const dot: Record<ZoneStatus, string> = {
  yes: "bg-green-500",
  no: "bg-red-500",
  conditional: "bg-gold-500",
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
