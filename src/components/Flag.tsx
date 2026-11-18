import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/format";

/** Small, simplified country flags for the language menu (20×14, rounded). */
const flags: Record<Locale, React.ReactNode> = {
  en: (
    <>
      <rect width="20" height="14" fill="#012169" />
      <path d="M0 0l20 14M20 0L0 14" stroke="#fff" strokeWidth="2.8" />
      <path d="M0 0l20 14M20 0L0 14" stroke="#C8102E" strokeWidth="1.1" />
      <path d="M10 0v14M0 7h20" stroke="#fff" strokeWidth="4.2" />
      <path d="M10 0v14M0 7h20" stroke="#C8102E" strokeWidth="2.4" />
    </>
  ),
  ar: (
    <>
      <rect width="20" height="14" fill="#006C35" />
      <path d="M5.5 5.2h9M6.5 6.6h7" stroke="#fff" strokeWidth=".8" strokeLinecap="round" />
      <path d="M5 9.6h9.2l.9-.6" stroke="#fff" strokeWidth=".8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  ur: (
    <>
      <rect width="20" height="14" fill="#01411C" />
      <rect width="5" height="14" fill="#fff" />
      <circle cx="12.6" cy="7" r="3.3" fill="#fff" />
      <circle cx="13.6" cy="6.3" r="2.9" fill="#01411C" />
      <path d="M15.6 4.6l.35.95 1-.1-.8.6.35.95-.85-.55-.8.6.25-.95-.85-.55h1z" fill="#fff" />
    </>
  ),
  hi: (
    <>
      <rect width="20" height="14" fill="#fff" />
      <rect width="20" height="4.67" fill="#FF9933" />
      <rect y="9.33" width="20" height="4.67" fill="#138808" />
      <circle cx="10" cy="7" r="1.7" fill="none" stroke="#000080" strokeWidth=".55" />
      <circle cx="10" cy="7" r=".35" fill="#000080" />
    </>
  ),
  zh: (
    <>
      <rect width="20" height="14" fill="#EE1C25" />
      <path d="M4 2.2l.6 1.8h1.9l-1.5 1.1.6 1.8L4 5.8 2.4 6.9 3 5.1 1.5 4h1.9z" fill="#FFFF00" />
      <circle cx="7.6" cy="1.8" r=".45" fill="#FFFF00" />
      <circle cx="8.6" cy="3.2" r=".45" fill="#FFFF00" />
      <circle cx="8.6" cy="4.9" r=".45" fill="#FFFF00" />
      <circle cx="7.6" cy="6.2" r=".45" fill="#FFFF00" />
    </>
  ),
};

export function Flag({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <svg viewBox="0 0 20 14" width="20" height="14" className={cn("shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/10", className)} aria-hidden>
      {flags[locale]}
    </svg>
  );
}
