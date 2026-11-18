import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LogoMark } from "@/components/Logo";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <section className="container-x flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <LogoMark className="h-16 w-16 animate-float" />
      <p className="font-display mt-8 text-7xl text-ink-900" dir="ltr">404</p>
      <h1 className="font-display mt-4 text-3xl">{t("title")}</h1>
      <p className="mt-3 text-ink-500">{t("body")}</p>
      <Link href="/" className="btn btn-primary mt-8">{t("cta")}</Link>
    </section>
  );
}
