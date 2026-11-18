import { z } from "zod";
import { getAppSession } from "@/lib/workspace/session";
import { logActivity } from "@/lib/workspace/store";

const Body = z.object({
  kind: z.enum(["search", "map_view", "calc"]),
  title: z.string().trim().min(1).max(200),
  href: z.string().startsWith("/app").max(300).optional(),
});

/** Records a workspace action (map view, search, calculation) for usage and history. */
export async function POST(req: Request) {
  const session = await getAppSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  await logActivity(session, parsed.data);
  return Response.json({ ok: true });
}
