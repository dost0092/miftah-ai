import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

type Messages = Record<string, unknown>;

function deepMerge(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const existing = out[key];
    if (value && typeof value === "object" && !Array.isArray(value) && existing && typeof existing === "object" && !Array.isArray(existing)) {
      out[key] = deepMerge(existing as Messages, value as Messages);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const english = (await import("../../messages/en.json")).default as Messages;
  if (locale === "en") return { locale, messages: english };

  // Any string not yet translated falls back to English instead of breaking the page.
  const localized = (await import(`../../messages/${locale}.json`)).default as Messages;
  return { locale, messages: deepMerge(english, localized) };
});
