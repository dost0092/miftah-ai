import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAppSession } from "@/lib/workspace/session";
import { getThread, listThreads } from "@/lib/workspace/store";
import { AdvisorChat } from "@/components/app/AdvisorChat";
import { aiProvider } from "@/lib/workspace/llm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ t?: string; q?: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.nav" });
  return { title: t("advisor") };
}

export default async function AdvisorPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { t: threadParam, q } = await searchParams;
  const session = (await getAppSession())!;
  const [threads, current] = await Promise.all([listThreads(session), threadParam ? getThread(session, threadParam) : null]);

  return (
    <AdvisorChat
      key={current?.thread.id ?? "new"}
      threads={threads}
      threadId={current?.thread.id ?? null}
      initialMessages={(current?.messages ?? []).map((m) => ({ role: m.role, content: m.content, sources: m.sources ?? [] }))}
      initialQuestion={!current && q ? q.slice(0, 2000) : null}
      aiMode={aiProvider() !== null}
    />
  );
}
