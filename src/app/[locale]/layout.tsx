import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Geist, Geist_Mono, Instrument_Serif, IBM_Plex_Sans_Arabic, Noto_Nastaliq_Urdu, Noto_Sans_Devanagari, Noto_Sans_SC } from "next/font/google";
import { routing, rtlLocales, type Locale } from "@/i18n/routing";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SITE_URL, pageMetadata } from "@/lib/site";
import "../globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
const arabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600", "700"], variable: "--font-arabic", display: "swap", preload: false });
const urdu = Noto_Nastaliq_Urdu({ subsets: ["arabic"], weight: ["400", "600", "700"], variable: "--font-urdu", display: "swap", preload: false });
const devanagari = Noto_Sans_Devanagari({ subsets: ["devanagari"], weight: ["400", "500", "600", "700"], variable: "--font-devanagari", display: "swap", preload: false });
const sc = Noto_Sans_SC({ weight: ["400", "500", "700"], variable: "--font-sc", display: "swap", preload: false });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#062a1c",
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
  const fontVars = [geist.variable, geistMono.variable, serif.variable, arabic.variable, urdu.variable, devanagari.variable, sc.variable].join(" ");

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
    <html lang={locale} dir={dir} className={fontVars}>
      <body className="min-h-screen font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <NextIntlClientProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
            Skip to content
          </a>
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
