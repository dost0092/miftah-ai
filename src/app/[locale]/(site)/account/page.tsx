import { redirect } from "@/i18n/navigation";

// The account now lives inside the signed-in workspace.
export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return redirect({ href: "/app", locale });
}
