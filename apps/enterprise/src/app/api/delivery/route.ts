import { ent, monorepoCwd, jsonOk, jsonErr } from "@/lib/enterprise";
import { mirrorEngagements } from "@/lib/enterprise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const api = await ent();
    return jsonOk({ deliveries: api.listDeliveries(monorepoCwd()) });
  } catch (e) {
    return jsonErr(e, 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const api = await ent();
    const cwd = monorepoCwd();
    if (body.action === "create") {
      const delivery = api.createDeliveryRecord(
        body.engagement_id,
        body,
        cwd,
      );
      await mirrorEngagements();
      return jsonOk({ delivery }, 201);
    }
    if (body.action === "deploy") {
      const delivery = api.markDeployed(body.id, body.url, cwd);
      await mirrorEngagements();
      return jsonOk({ delivery });
    }
    if (body.action === "maintenance") {
      const delivery = api.activateMaintenance(body.id, cwd);
      await mirrorEngagements();
      return jsonOk({ delivery });
    }
    if (body.action === "health") {
      const delivery = api.healthCheck(body.id, cwd);
      await mirrorEngagements();
      return jsonOk({ delivery });
    }
    return jsonErr("unknown action");
  } catch (e) {
    return jsonErr(e);
  }
}
