import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { IconCheck } from "../Icons";
import { LogoMark } from "../Logo";

/** Split-screen layout for sign in / sign up / password pages. */
export function AuthShell({ children }: { children: ReactNode }) {
  const t = useTranslations("auth");
  const points = t.raw("sidePoints") as string[];
  return (
    <section className="grid min-h-[calc(100vh-72px)] lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-16 sm:px-8">
        <div className="hero-in w-full max-w-md">{children}</div>
      </div>
      <aside className="relative hidden overflow-hidden border-s border-sand-200 bg-canvas lg:flex lg:items-center">
        <div className="grid-lines pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-md px-10">
          <LogoMark className="h-12 w-12" />
          <p className="font-display mt-8 text-4xl leading-tight text-ink-900">{t("sideTitle")}</p>
          <ul className="mt-8 space-y-4">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-3 text-ink-700">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-green-50 text-green-600 ring-1 ring-inset ring-green-600/15"><IconCheck width={14} height={14} /></span>
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-10 text-sm text-ink-400">{t("sideNote")}</p>
        </div>
      </aside>
    </section>
  );
}
