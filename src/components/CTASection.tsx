import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { IconArrow } from "./Icons";
import { Reveal } from "./Reveal";

export function CTASection() {
  const t = useTranslations("home.cta");
  return (
    <section className="container-x py-20 sm:py-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-sand-200 bg-canvas px-6 py-16 text-center sm:px-12 sm:py-20">
          <div className="grid-lines pointer-events-none absolute inset-0" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-display text-3xl leading-tight text-ink-900 sm:text-5xl">{t("title")}</h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-ink-500">{t("subtitle")}</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/waitlist" className="btn btn-primary">
                {t("button")}
                <IconArrow width={16} height={16} className="flip-rtl" />
              </Link>
              <Link href="/contact" className="btn btn-ghost">
                {t("secondary")}
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
