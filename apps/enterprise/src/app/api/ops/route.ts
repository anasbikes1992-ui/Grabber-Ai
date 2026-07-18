import { ent, monorepoCwd, jsonOk, jsonErr } from "@/lib/enterprise";
import { mirrorEngagements } from "@/lib/enterprise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const api = await ent();
    const cwd = monorepoCwd();
    return jsonOk({
      snapshot: api.getOpsSnapshot(cwd),
      tickets: api.listTickets(cwd),
      leads: api.listLeads(cwd),
    });
  } catch (e) {
    return jsonErr(e, 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const api = await ent();
    const cwd = monorepoCwd();
    if (body.action === "ticket") {
      const ticket = api.createTicket(body, cwd);
      await mirrorEngagements();
      return jsonOk({ ticket }, 201);
    }
    if (body.action === "lead") {
      const lead = api.recordLead(body, cwd);
      await mirrorEngagements();
      return jsonOk({ lead }, 201);
    }
    if (body.action === "update_ticket") {
      const ticket = api.updateTicket(body.id, body.patch || {}, cwd);
      await mirrorEngagements();
      return jsonOk({ ticket });
    }
    return jsonErr("unknown action");
  } catch (e) {
    return jsonErr(e);
  }
}
