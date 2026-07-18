import { ent, monorepoCwd, jsonOk, jsonErr } from "@/lib/enterprise";
import { mirrorEngagements } from "@/lib/enterprise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const api = await ent();
    const engagements = api.listEngagements(monorepoCwd());
    return jsonOk({ engagements });
  } catch (e) {
    return jsonErr(e, 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const api = await ent();
    const engagement = api.createEngagement(
      {
        name: body.name || body.client_name,
        industry: body.industry || "saas",
        contact_email: body.contact_email || body.email || "",
        notes: body.notes || "",
      },
      monorepoCwd(),
    );
    await mirrorEngagements();
    return jsonOk({ engagement }, 201);
  } catch (e) {
    return jsonErr(e);
  }
}
