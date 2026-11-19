import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { IconArrow } from "./Icons";

/** Closing call to action: plain, left-aligned, with a human contact next to the button. */
export function CTASection() {
  const t = useTranslations("home.cta");
  return (
    <section className="border-t border-sand-200 bg-night-950 text-white">
      <div className="container-x grid gap-8 py-16 sm:py-20 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <h2 className="max-w-xl text-3xl font-semibold leading-[1.15] tracking-tight sm:text-[2.6rem]">{t("title")}</h2>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-white/70">{t("subtitle")}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
          <Link href="/signup" className="btn bg-white text-night-950 hover:bg-sand-100">
            {t("button")}
            <IconArrow width={16} height={16} className="flip-rtl" />
          </Link>
          <Link href="/contact" className="btn border border-white/25 text-white hover:bg-white/10">
            {t("secondary")}
          </Link>
        </div>
      </div>
      <div className="sadu-band" />
    </section>
  );
}
