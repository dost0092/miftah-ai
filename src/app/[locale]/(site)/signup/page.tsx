import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthForm } from "@/components/auth/AuthForm";
import { pageMetadata } from "@/lib/site";
import { googleAuthEnabled } from "@/lib/auth-providers";

export const revalidate = 600;

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { ...pageMetadata({ locale, path: "/signup", title: t("signupTitle") }), robots: { index: false } };
}

export default async function Page({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  const google = await googleAuthEnabled();
  return (
    <AuthShell>
      <Suspense fallback={<div className="h-96" />}>
        <AuthForm mode="signup" google={google} />
      </Suspense>
    </AuthShell>
  );
}
