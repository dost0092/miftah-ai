import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthForm } from "@/components/auth/AuthForm";
import { pageMetadata } from "@/lib/site";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { ...pageMetadata({ locale, path: "/forgot-password", title: t("forgotTitle") }), robots: { index: false } };
}

export default async function Page({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <AuthShell>
      <Suspense fallback={<div className="h-96" />}>
        <AuthForm mode="forgot" />
      </Suspense>
    </AuthShell>
  );
}
