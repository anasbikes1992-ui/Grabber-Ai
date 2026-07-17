import { ent, monorepoCwd, jsonOk, jsonErr } from "@/lib/enterprise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Factory Integration (Milestone 4) — DNA only when governance complete. */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const api = await ent();
    const handoff = api.getFactoryHandoff(id, monorepoCwd());
    return jsonOk({ handoff });
  } catch (e) {
    return jsonErr(e, 403);
  }
}
