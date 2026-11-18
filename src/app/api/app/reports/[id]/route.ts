import { getAppSession } from "@/lib/workspace/session";
import { deleteReport } from "@/lib/workspace/store";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAppSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });
  await deleteReport(session, (await params).id);
  return Response.json({ ok: true });
}
