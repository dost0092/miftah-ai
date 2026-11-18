import { redirect } from "@/i18n/navigation";

// Miftah AI is open: the old waitlist now leads straight to sign-up.
export default async function WaitlistPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return redirect({ href: "/signup", locale });
}
