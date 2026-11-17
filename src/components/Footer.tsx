import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "./Logo";
import { IconMail } from "./Icons";

export function Footer() {
  const t = useTranslations("footer");
  const n = useTranslations("nav");
  const s = useTranslations("solutions");
  const solutionItems = s.raw("items") as Array<{ id: string; title: string }>;
  const year = new Date().getFullYear();

  const cols = [
    {
      title: t("product"),
      links: [
        { href: "/product", label: n("productItems.advisor.title") },
        { href: "/districts", label: n("productItems.districts.title") },
        { href: "/calculator", label: n("productItems.calculator.title") },
        { href: "/pricing", label: n("pricing") },
        { href: "/developers", label: n("developers") },
      ],
    },
    {
      title: t("solutions"),
      links: solutionItems.map((i) => ({ href: `/solutions#${i.id}`, label: i.title })),
    },
    {
      title: t("company"),
      links: [
        { href: "/about", label: n("about") },
        { href: "/trust", label: n("trust") },
        { href: "/contact", label: n("contact") },
        { href: "/waitlist", label: n("cta") },
      ],
    },
    {
      title: t("legal"),
      links: [
        { href: "/legal/privacy", label: t("privacy") },
        { href: "/legal/terms", label: t("terms") },
        { href: "/legal/disclaimer", label: t("disclaimer") },
      ],
    },
  ];

  return (
    <footer className="relative overflow-hidden bg-night-950 text-white">
      <div className="sadu-band opacity-80" />
      <div className="sadu-pattern pointer-events-none absolute inset-0 opacity-60" />
      <div className="container-x relative py-16">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div className="max-w-sm">
            <Logo dark />
            <p className="mt-5 text-white/70">{t("tagline")}</p>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm font-semibold">{t("newsletterTitle")}</p>
              <Link href="/waitlist" className="btn btn-gold mt-4 !py-2.5 text-sm">
                <IconMail width={16} height={16} />
                {t("newsletterCta")}
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {cols.map((c) => (
              <div key={c.title}>
                <p className="text-sm font-semibold text-gold-300">{c.title}</p>
                <ul className="mt-4 space-y-3">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-sm text-white/65 transition hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 border-t border-white/10 pt-8 text-xs leading-relaxed text-white/50">
          <p>{t("attribution")}</p>
          <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row">
            <p>© {year} Miftah AI. {t("rights")}</p>
            <p dir="ltr">miftahai.co</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
