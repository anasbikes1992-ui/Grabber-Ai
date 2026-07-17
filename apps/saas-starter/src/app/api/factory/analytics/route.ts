import { NextResponse } from "next/server";
import { buildAnalyticsDashboard } from "@/metrics/analytics";
import { toErrorResponse } from "@/lib/logger";

export const runtime = "nodejs";

/** GET /api/factory/analytics — build history, reuse, trends */
export async function GET() {
  try {
    const analytics = buildAnalyticsDashboard(process.cwd());
    return NextResponse.json({ ok: true, analytics });
  } catch (e) {
    const { status, body } = toErrorResponse(e);
    return NextResponse.json(body, { status });
  }
}
