import type { ReactNode } from "react";
import { cn } from "@/lib/format";
import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = false,
  dark = false,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  center?: boolean;
  dark?: boolean;
  className?: string;
}) {
  return (
    <Reveal className={cn("max-w-2xl", center && "mx-auto text-center", className)}>
      {eyebrow && (
        <p className={cn("eyebrow", dark && "!text-gold-300", center && "justify-center")}>
          <span className={cn("h-px w-6", dark ? "bg-gold-400" : "bg-green-600")} />
          {eyebrow}
        </p>
      )}
      <h2 className={cn("font-display mt-4 text-3xl leading-[1.1] tracking-tight sm:text-[2.6rem]", dark ? "text-white" : "text-ink-900")}>{title}</h2>
      {subtitle && <p className={cn("mt-4 text-lg leading-relaxed", dark ? "text-white/70" : "text-ink-500")}>{subtitle}</p>}
    </Reveal>
  );
}

/** Dark green hero used at the top of inner pages. */
export function PageHero({ eyebrow, title, subtitle, children }: { eyebrow: string; title: ReactNode; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-green-900 text-white">
      <div className="sadu-pattern pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -top-40 start-1/2 h-[480px] w-[780px] -translate-x-1/2 rounded-full bg-green-500/25 blur-3xl rtl:translate-x-1/2" />
      <div className="container-x relative py-20 sm:py-24">
        <div className="hero-in max-w-3xl">
          <p className="eyebrow !text-gold-300">
            <span className="h-px w-6 bg-gold-400" />
            {eyebrow}
          </p>
          <h1 className="font-display mt-5 text-4xl leading-[1.05] tracking-tight sm:text-6xl">{title}</h1>
          {subtitle && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75">{subtitle}</p>}
          {children}
        </div>
      </div>
      <div className="sadu-band opacity-70" />
    </section>
  );
}

export function SampleBanner({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gold-300 bg-gold-100/60 p-4 text-sm text-gold-700">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold-500 text-[11px] font-bold text-white">!</span>
      <p>{text}</p>
    </div>
  );
}
