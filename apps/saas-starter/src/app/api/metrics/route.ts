import { NextResponse } from "next/server";
import { listFactoryMetrics, summarizeFactoryMetrics } from "@/metrics";

export const runtime = "nodejs";

/** GET /api/metrics — factory metrics history + rollup */
export async function GET() {
  const cwd = process.cwd();
  return NextResponse.json({
    ok: true,
    summary: summarizeFactoryMetrics(cwd),
    recent: listFactoryMetrics(cwd).slice(-20).reverse(),
  });
}
