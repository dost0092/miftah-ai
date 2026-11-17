import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { IconArrow } from "./Icons";

/** Thin brand bar above the header announcing the foreign-ownership law. */
export function AnnouncementBar() {
  const t = useTranslations("announce");
  return (
    <div className="relative overflow-hidden bg-green-900 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent,rgb(220_189_120/.12),transparent)]" />
      <div className="container-x relative flex min-h-10 items-center justify-center gap-3 py-2 text-center text-[13px]">
        <span className="hidden h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-gold-400 sm:block" />
        <span className="text-white/85">{t("text")}</span>
        <Link href="/trust" className="inline-flex shrink-0 items-center gap-1 font-semibold text-gold-300 transition hover:text-gold-100">
          {t("cta")} <IconArrow width={13} height={13} />
        </Link>
      </div>
    </div>
  );
}
