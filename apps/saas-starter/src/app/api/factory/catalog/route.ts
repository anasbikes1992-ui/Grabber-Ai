import { NextResponse } from "next/server";
import { buildFactoryCatalog } from "@/factory/registry-v2";
import { toErrorResponse } from "@/lib/logger";

export const runtime = "nodejs";

/** GET /api/factory/catalog — Factory Registry v2 */
export async function GET() {
  try {
    const catalog = buildFactoryCatalog(process.cwd());
    return NextResponse.json({ ok: true, catalog });
  } catch (e) {
    const { status, body } = toErrorResponse(e);
    return NextResponse.json(body, { status });
  }
}
