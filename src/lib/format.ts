// Use Latin digits in every locale so figures match official sources and stay easy to compare.
export function numberLocale(locale: string) {
  const tag = locale === "zh" ? "zh-CN" : locale === "ar" ? "ar-SA" : locale;
  return `${tag}-u-nu-latn`;
}

export function fmtNumber(locale: string, n: number, opts: Intl.NumberFormatOptions = {}) {
  return new Intl.NumberFormat(numberLocale(locale), { maximumFractionDigits: 0, ...opts }).format(n);
}

export function fmtPercent(locale: string, n: number, signed = true) {
  return new Intl.NumberFormat(numberLocale(locale), {
    style: "percent",
    maximumFractionDigits: 1,
    signDisplay: signed ? "exceptZero" : "auto",
  }).format(n);
}

export function fmtDate(locale: string, iso: string) {
  return new Intl.DateTimeFormat(numberLocale(locale), { year: "numeric", month: "short", day: "numeric" }).format(new Date(iso));
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** "3 hours ago", "yesterday", or a date once it is more than a week old. */
export function fmtRelative(locale: string, iso: string, now = Date.now()) {
  const diff = (new Date(iso).getTime() - now) / 1000;
  const abs = Math.abs(diff);
  if (abs > 7 * 86400) return fmtDate(locale, iso);
  const rtf = new Intl.RelativeTimeFormat(numberLocale(locale), { numeric: "auto" });
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  return rtf.format(Math.round(diff / 86400), "day");
}
