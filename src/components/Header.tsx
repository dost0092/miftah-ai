"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { IconArrow, IconCalc, IconChat, IconChevron, IconDoc, IconMap, IconMenu, IconX } from "./Icons";
import { cn } from "@/lib/format";

const productItems = [
  { key: "advisor", href: "/product", Icon: IconChat },
  { key: "districts", href: "/districts", Icon: IconMap },
  { key: "calculator", href: "/calculator", Icon: IconCalc },
  { key: "reports", href: "/product#reports", Icon: IconDoc },
] as const;

const links = [
  { key: "solutions", href: "/solutions" },
  { key: "pricing", href: "/pricing" },
  { key: "trust", href: "/trust" },
  { key: "developers", href: "/developers" },
  { key: "about", href: "/about" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProductOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className={cn("sticky top-0 z-40 transition-all duration-300", scrolled ? "border-b border-sand-200/80 bg-sand-50/85 backdrop-blur-xl" : "bg-sand-50")}>
      <div className="container-x flex h-16 items-center justify-between gap-4 lg:h-[72px]">
        <Link href="/" className="shrink-0" aria-label="Miftah AI home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          <div className="relative" onMouseEnter={() => setProductOpen(true)} onMouseLeave={() => setProductOpen(false)}>
            <button
              type="button"
              className={cn("inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium text-ink-700 transition hover:bg-sand-100 hover:text-ink-900", productOpen && "bg-sand-100")}
              aria-expanded={productOpen}
              onClick={() => setProductOpen((v) => !v)}
            >
              {t("product")}
              <IconChevron width={14} height={14} className={cn("transition", productOpen && "rotate-180")} />
            </button>
            <div className={cn("absolute start-0 top-full pt-2 transition", productOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0")}>
              <div className="grid w-[420px] gap-1 rounded-2xl border border-sand-200 bg-white p-2 shadow-2xl shadow-ink-900/10">
                {productItems.map(({ key, href, Icon }) => (
                  <Link key={key} href={href} className="group flex items-start gap-3 rounded-xl p-3 transition hover:bg-sand-100">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-green-50 text-green-600 transition group-hover:bg-green-600 group-hover:text-white">
                      <Icon width={18} height={18} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-ink-900">{t(`productItems.${key}.title`)}</span>
                      <span className="block text-sm text-ink-500">{t(`productItems.${key}.desc`)}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {links.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-medium transition hover:bg-sand-100 hover:text-ink-900",
                isActive(l.href) ? "text-green-700" : "text-ink-700",
              )}
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:block" />
          <Link href="/waitlist" className="btn btn-primary hidden !py-2.5 text-sm sm:inline-flex">
            {t("cta")}
            <IconArrow width={16} height={16} />
          </Link>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-sand-200 bg-white lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? t("close") : t("menu")}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <IconX /> : <IconMenu />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-sand-50 lg:hidden">
          <div className="container-x flex flex-col gap-1 py-6">
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-ink-400">{t("product")}</p>
            {productItems.map(({ key, href, Icon }) => (
              <Link key={key} href={href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium hover:bg-sand-100">
                <Icon width={18} height={18} className="text-green-600" />
                {t(`productItems.${key}.title`)}
              </Link>
            ))}
            <div className="my-3 h-px bg-sand-200" />
            {[...links, { key: "contact", href: "/contact" } as const].map((l) => (
              <Link key={l.key} href={l.href} className="rounded-xl px-3 py-3 text-base font-medium hover:bg-sand-100">
                {t(l.key)}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-3">
              <LanguageSwitcher align="start" />
              <Link href="/waitlist" className="btn btn-primary w-full">
                {t("cta")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
