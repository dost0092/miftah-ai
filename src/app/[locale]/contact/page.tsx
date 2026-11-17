import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/Section";
import { ContactForm } from "@/components/ContactForm";
import { IconBriefcase, IconMail, IconPin } from "@/components/Icons";
import { CONTACT_EMAIL, pageMetadata } from "@/lib/site";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return pageMetadata({ locale, path: "/contact", title: t("eyebrow"), description: t("subtitle") });
}

export default async function ContactPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  const channels = [
    { Icon: IconMail, label: t("channels.email"), value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
    { Icon: IconBriefcase, label: t("channels.partners"), value: "partners@miftah.ai", href: "mailto:partners@miftah.ai" },
    { Icon: IconPin, label: t("channels.hq"), value: t("channels.hqValue") },
  ];
  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
      <section className="container-x grid gap-8 py-16 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-4">
          {channels.map(({ Icon, label, value, href }) => (
            <div key={label} className="card flex items-center gap-4 p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-green-50 text-green-600"><Icon width={20} height={20} /></span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
                {href ? (
                  <a href={href} className="font-semibold text-ink-900 hover:text-green-700" dir="ltr">{value}</a>
                ) : (
                  <p className="font-semibold text-ink-900">{value}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        <ContactForm />
      </section>
    </>
  );
}
