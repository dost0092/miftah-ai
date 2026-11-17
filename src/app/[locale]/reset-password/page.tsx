import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { pageMetadata } from "@/lib/site";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { ...pageMetadata({ locale, path: "/reset-password", title: t("resetTitle") }), robots: { index: false } };
}

export default async function Page({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <AuthShell>
      <Suspense fallback={<div className="h-96" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
