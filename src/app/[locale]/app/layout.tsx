import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getAppSession, displayName } from "@/lib/workspace/session";
import { AppSidebar } from "@/components/app/AppSidebar";
import { AppTopbar } from "@/components/app/AppTopbar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: { default: "Workspace", template: "%s · Miftah AI" }, robots: { index: false, follow: false } };

/** Signed-in workspace: icon rail, top bar with global search, scrollable content area. */
export default async function AppLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getAppSession();
  if (!session) return redirect({ href: { pathname: "/login", query: { next: `/${locale}/app` } }, locale });

  return (
    <div className="app-root flex h-dvh overflow-hidden bg-white">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar name={displayName(session)} email={session.user.email ?? ""} preview={session.preview} />
        <main id="main" className="app-main min-h-0 flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>
      </div>
    </div>
  );
}
