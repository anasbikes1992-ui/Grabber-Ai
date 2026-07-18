import { ent, monorepoCwd, jsonOk, jsonErr } from "@/lib/enterprise";
import { mirrorEngagements } from "@/lib/enterprise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const api = await ent();
    const engagement = api.advanceGovernance(
      id,
      {
        stage: body.stage,
        actor: body.actor || "ops",
        notes: body.notes || "approved",
      },
      monorepoCwd(),
    );
    await mirrorEngagements();
    return jsonOk({ engagement });
  } catch (e) {
    return jsonErr(e);
  }
}
