import { cn } from "@/lib/format";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-9 w-9 shrink-0", className)} aria-hidden>
      <defs>
        <linearGradient id="mk-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#12854a" />
          <stop offset="1" stopColor="#062a1c" />
        </linearGradient>
        <linearGradient id="mk-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e3cb94" />
          <stop offset="1" stopColor="#c49a3c" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#mk-g)" />
      {/* Key bow drawn as an arch, a nod to the traditional Najdi doorway */}
      <path d="M13 18a7 7 0 0 1 14 0v1.5H13Z" fill="none" stroke="url(#mk-gold)" strokeWidth="2.6" strokeLinejoin="round" />
      <circle cx="20" cy="16.3" r="1.8" fill="url(#mk-gold)" />
      <path d="M20 19.5V31M20 26.5h3.8M20 30h2.6" stroke="url(#mk-gold)" strokeWidth="2.6" strokeLinecap="round" />
      {/* AI spark */}
      <path d="M31 6.5v4.5M28.75 8.75h4.5" stroke="#e3cb94" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className={cn("text-[1.15rem] font-semibold tracking-tight", dark ? "text-white" : "text-ink-900")} dir="ltr">
          Miftah<span className={dark ? "text-gold-400" : "text-green-600"}> AI</span>
        </span>
        <span className={cn("mt-1 text-[0.7rem] font-medium", dark ? "text-white/55" : "text-ink-400")} lang="ar" dir="rtl">
          مفتاح AI
        </span>
      </span>
    </span>
  );
}
