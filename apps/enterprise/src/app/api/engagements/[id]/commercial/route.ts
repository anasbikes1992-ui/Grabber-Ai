import { ent, monorepoCwd, jsonOk, jsonErr } from "@/lib/enterprise";
import { mirrorEngagements } from "@/lib/enterprise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const api = await ent();
    const engagement = api.runCommercialAutomation(id, monorepoCwd());
    await mirrorEngagements();
    return jsonOk({ engagement });
  } catch (e) {
    return jsonErr(e);
  }
}
