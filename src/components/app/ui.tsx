import { cn } from "@/lib/format";

/** Small shared building blocks for workspace pages. */
export function Panel({ title, action, children, className, bodyClass }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={cn("min-w-0 rounded-2xl border border-sand-200 bg-white shadow-[0_1px_2px_rgb(11_13_18/.04)]", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-5 pb-1 pt-5 sm:px-6">
          {title && <h2 className="text-[15px] font-semibold text-ink-900">{title}</h2>}
          {action}
        </div>
      )}
      <div className={cn("px-5 pb-5 pt-3 sm:px-6", bodyClass)}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-[1.7rem]">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}

const statusStyle: Record<string, string> = {
  verified: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  needs_review: "bg-amber-50 text-amber-700 ring-amber-600/25",
  guidance: "bg-green-50 text-green-700 ring-green-600/20",
  sample: "bg-sand-100 text-ink-500 ring-ink-400/25",
};

export function StatusBadge({ status, label, className }: { status: string; label: string; className?: string }) {
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset", statusStyle[status] ?? statusStyle.sample, className)}>{label}</span>;
}

export function EmptyState({ icon, title, body, action }: { icon: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="px-4 py-12 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-sand-200 bg-sand-50 text-ink-400">{icon}</span>
      <p className="mt-4 text-sm font-semibold text-ink-900">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
