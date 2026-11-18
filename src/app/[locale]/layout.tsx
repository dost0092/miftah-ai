import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, rtlLocales, type Locale } from "@/i18n/routing";
import { Header } from "@/components/Header";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Footer } from "@/components/Footer";
import { SITE_URL, pageMetadata } from "@/lib/site";
// Fonts are bundled from npm (Fontsource), so builds never depend on reaching Google Fonts.
// Each file uses unicode-range, so browsers only download the scripts a page actually uses.
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "@fontsource-variable/noto-nastaliq-urdu";
import "@fontsource-variable/noto-sans-devanagari";
import "@fontsource-variable/noto-sans-sc";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(SITE_URL),
    ...pageMetadata({ locale, title: t("title"), description: t("description") }),
    title: { default: t("title"), template: "%s · Miftah AI" },
    applicationName: "Miftah AI",
    keywords: ["Saudi Arabia property", "foreign ownership Saudi", "Riyadh property prices", "Jeddah property prices", "عقار السعودية", "تملك غير السعوديين", "Miftah AI", "مفتاح"],
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const dir = rtlLocales.includes(locale as Locale) ? "rtl" : "ltr";

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Miftah AI",
    alternateName: "مفتاح AI",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    slogan: "Your AI key to property in Saudi Arabia",
    areaServed: { "@type": "Country", name: "Saudi Arabia" },
  };

  return (
    <html lang={locale} dir={dir}>
      <body className="min-h-screen font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <NextIntlClientProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
            Skip to content
          </a>
          <AnnouncementBar />
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
