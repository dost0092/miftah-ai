import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { IconArrow } from "./Icons";

/** Thin bar above the header announcing the foreign-ownership law. */
export function AnnouncementBar() {
  const t = useTranslations("announce");
  return (
    <div className="border-b border-sand-200 bg-sand-50">
      <div className="container-x flex min-h-9 items-center justify-center gap-2 py-1.5 text-center text-[13px]">
        <span className="hidden rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700 ring-1 ring-inset ring-green-600/15 sm:inline" dir="ltr">2026</span>
        <span className="text-ink-700">{t("text")}</span>
        <Link href="/guide" className="inline-flex shrink-0 items-center gap-1 font-medium text-ink-900 underline-offset-4 hover:underline">
          {t("cta")} <IconArrow width={13} height={13} className="flip-rtl" />
        </Link>
      </div>
    </div>
  );
}
