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
