import { defineRouting } from "next-intl/routing";

export const locales = ["en", "ar", "ur", "hi", "zh"] as const;
export type Locale = (typeof locales)[number];

export const rtlLocales: Locale[] = ["ar", "ur"];

export const localeNames: Record<Locale, { native: string; english: string }> = {
  en: { native: "English", english: "English" },
  ar: { native: "العربية", english: "Arabic" },
  ur: { native: "اردو", english: "Urdu" },
  hi: { native: "हिन्दी", english: "Hindi" },
  zh: { native: "中文", english: "Chinese" },
};

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
});
