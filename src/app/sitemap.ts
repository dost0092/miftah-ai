import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";
import { districts } from "@/lib/districts";
import { SITE_URL } from "@/lib/site";

const staticPaths = ["", "/product", "/districts", "/calculator", "/pricing", "/solutions", "/trust", "/developers", "/about", "/contact", "/signup", "/legal/privacy", "/legal/terms", "/legal/refunds", "/legal/disclaimer"];

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [...staticPaths, ...districts.map((d) => `/districts/${d.slug}`)];
  const now = new Date();
  return paths.map((path) => ({
    url: `${SITE_URL}/en${path}`,
    lastModified: now,
    changeFrequency: path.startsWith("/districts") ? "monthly" : "weekly",
    priority: path === "" ? 1 : path.startsWith("/legal") ? 0.3 : 0.7,
    alternates: { languages: Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}${path}`])) },
  }));
}
