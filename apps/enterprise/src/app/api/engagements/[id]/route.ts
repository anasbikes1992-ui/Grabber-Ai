import { ent, monorepoCwd, jsonOk, jsonErr } from "@/lib/enterprise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const api = await ent();
    const engagement = api.getEngagement(id, monorepoCwd());
    return jsonOk({ engagement });
  } catch (e) {
    return jsonErr(e, 404);
  }
}
