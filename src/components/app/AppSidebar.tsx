"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LogoMark } from "@/components/Logo";
import { cn } from "@/lib/format";
import { accountNav, appNav, isActive } from "./nav";

/** Dark icon rail on desktop, bottom tab bar on phones. */
export function AppSidebar() {
  const t = useTranslations("app.nav");
  const pathname = usePathname();
  const item = (href: string, key: string, Icon: (p: { width?: number; height?: number }) => React.ReactNode) => {
    const active = isActive(pathname, href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn("group flex w-full flex-col items-center gap-1.5 rounded-xl px-1 py-2 text-[11px] font-medium leading-tight transition", active ? "text-white" : "text-white/55 hover:text-white")}
      >
        <span className={cn("grid h-9 w-9 place-items-center rounded-lg transition", active ? "bg-green-600 text-white shadow-[0_6px_16px_-6px_rgb(42_80_216/.9)]" : "group-hover:bg-white/10")}>
          <Icon width={19} height={19} />
        </span>
        <span className="text-center">{t(key)}</span>
      </Link>
    );
  };

  return (
    <>
      <aside className="hidden w-[92px] shrink-0 flex-col items-center bg-night-950 py-4 print:hidden md:flex" aria-label={t("menu")}>
        <Link href="/app" className="mb-6" aria-label="Miftah AI">
          <LogoMark className="h-10 w-10 ring-1 ring-white/15 rounded-[10px]" />
        </Link>
        <nav className="flex w-full flex-1 flex-col items-center gap-1 px-2">
          {appNav.map(({ href, key, Icon }) => item(href, key, Icon))}
          <span className="my-3 h-px w-10 bg-white/10" />
          {item(accountNav.href, accountNav.key, accountNav.Icon)}
        </nav>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-sand-200 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur print:hidden md:hidden" aria-label={t("menu")}>
        {[...appNav.filter((n) => n.key !== "calculator"), accountNav].map(({ href, key, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link key={href} href={href} className={cn("flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium", active ? "text-green-600" : "text-ink-500")}>
              <Icon width={20} height={20} />
              <span className="max-w-full truncate">{t(key)}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
