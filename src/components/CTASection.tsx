import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { IconArrow } from "./Icons";
import { LogoMark } from "./Logo";
import { Reveal } from "./Reveal";

export function CTASection() {
  const t = useTranslations("home.cta");
  return (
    <section className="container-x py-20 sm:py-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] bg-green-800 px-6 py-16 text-center text-white sm:px-12 sm:py-20">
          <div className="sadu-pattern pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute -bottom-32 start-1/2 h-80 w-[640px] -translate-x-1/2 rounded-full bg-gold-500/25 blur-3xl rtl:translate-x-1/2" />
          <div className="relative mx-auto max-w-2xl">
            <LogoMark className="mx-auto h-14 w-14 animate-float" />
            <h2 className="font-display mt-6 text-3xl leading-tight sm:text-5xl">{t("title")}</h2>
            <p className="mt-5 text-lg text-white/75">{t("subtitle")}</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/waitlist" className="btn btn-gold">
                {t("button")}
                <IconArrow width={16} height={16} />
              </Link>
              <Link href="/contact" className="btn btn-ghost-dark">
                {t("secondary")}
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
