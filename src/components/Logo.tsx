import { cn } from "@/lib/format";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-8 w-8 shrink-0", className)} aria-hidden>
      <rect width="40" height="40" rx="10" fill="#0a0b0d" />
      {/* Key bow drawn as an arch, a nod to the traditional Najdi doorway */}
      <path d="M13 18a7 7 0 0 1 14 0v1.5H13Z" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinejoin="round" />
      <circle cx="20" cy="16.3" r="1.8" fill="#ffffff" />
      <path d="M20 19.5V31M20 26.5h3.8M20 30h2.6" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" />
      {/* AI spark */}
      <path d="M31 6.5v4.5M28.75 8.75h4.5" stroke="#7290f2" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className={cn("text-[1.08rem] font-semibold tracking-[-0.02em]", dark ? "text-white" : "text-ink-900")} dir="ltr">
        Miftah AI
      </span>
    </span>
  );
}
