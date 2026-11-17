import type { Metadata } from "next";
import { locales } from "@/i18n/routing";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://miftah.ai").replace(/\/$/, "");
export const CONTACT_EMAIL = "hello@miftah.ai";

/** Builds per-page metadata with canonical + hreflang alternates for every language. */
export function pageMetadata({ locale, path = "", title, description }: { locale: string; path?: string; title?: string; description?: string }): Metadata {
  const languages = Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}${path}`]));
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}${path}`,
      languages: { ...languages, "x-default": `${SITE_URL}/en${path}` },
    },
    openGraph: {
      title: title ?? "Miftah AI",
      description,
      url: `${SITE_URL}/${locale}${path}`,
      siteName: "Miftah AI",
      locale,
      type: "website",
    },
    twitter: { card: "summary_large_image", title: title ?? "Miftah AI", description },
  };
}
