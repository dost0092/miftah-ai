import { z } from "zod";
import { getAppSession } from "@/lib/workspace/session";
import { createReport, logActivity } from "@/lib/workspace/store";
import { getDistrict } from "@/lib/districts";

const Body = z.object({
  type: z.enum(["district", "due_diligence", "cost"]),
  district: z.string().max(80),
  price: z.number().positive().max(1e10).optional(),
  propertyType: z.enum(["apartment", "villa", "land"]).default("apartment"),
  area: z.number().positive().max(1e6).optional(),
});

const TYPE_TITLE = { district: "District brief", due_diligence: "Buyer due-diligence checklist", cost: "Purchase cost estimate" } as const;

/** Creates a saved report. Reports store their inputs; figures are rendered from the library at view time. */
export async function POST(req: Request) {
  const session = await getAppSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  const { type, district, ...rest } = parsed.data;
  const d = getDistrict(district);
  if (!d) return Response.json({ error: "district" }, { status: 400 });
  const title = `${TYPE_TITLE[type]}: ${d.nameEn}, ${d.city === "riyadh" ? "Riyadh" : "Jeddah"}`;
  const id = await createReport(session, { type, title, district_slug: d.slug, params: rest });
  if (!id) return Response.json({ error: "save" }, { status: 500 });
  await logActivity(session, { kind: "report", title, href: `/app/reports/${id}` });
  return Response.json({ id });
}
