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
      {eyebrow && <p className={cn("eyebrow", dark && "!text-green-300", center && "justify-center")}>{eyebrow}</p>}
      <h2 className={cn("font-display mt-3 text-3xl leading-[1.1] sm:text-[2.6rem]", dark ? "text-white" : "text-ink-900")}>{title}</h2>
      {subtitle && <p className={cn("mt-4 text-lg leading-relaxed", dark ? "text-white/65" : "text-ink-500")}>{subtitle}</p>}
    </Reveal>
  );
}

/** Light hero used at the top of inner pages. */
export function PageHero({ eyebrow, title, subtitle, children }: { eyebrow: string; title: ReactNode; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-sand-200 bg-canvas">
      <div className="grid-lines pointer-events-none absolute inset-0" />
      <div className="container-x relative py-20 sm:py-24">
        <div className="hero-in max-w-3xl">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="font-display mt-4 text-4xl leading-[1.05] text-ink-900 sm:text-6xl">{title}</h1>
          {subtitle && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-500">{subtitle}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}

export function SampleBanner({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-500 text-[11px] font-bold text-white">!</span>
      <p>{text}</p>
    </div>
  );
}
