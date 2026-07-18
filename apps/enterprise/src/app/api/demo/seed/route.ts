import { ent, monorepoCwd, jsonOk, jsonErr } from "@/lib/enterprise";
import { mirrorEngagements } from "@/lib/enterprise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Seed full milestone happy path for demos. */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const api = await ent();
    const result = api.milestone1Sync(
      body.name || "Harbor Hotel",
      body.industry || "hospitality",
      monorepoCwd(),
    );
    await mirrorEngagements();
    return jsonOk(result, 201);
  } catch (e) {
    return jsonErr(e, 500);
  }
}
