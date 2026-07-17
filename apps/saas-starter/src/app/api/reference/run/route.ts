import { NextResponse } from "next/server";
import { runReferenceProduct, runGoldenReferenceSuite } from "@/blueprints";

export const runtime = "nodejs";

/**
 * POST /api/reference/run
 * Body: { product: "booking" | "saas" | "crm" | "marketplace" | "all" }
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, errors: ["invalid JSON"] }, { status: 400 });
  }
  const product = String((body as { product?: string }).product ?? "booking");
  const cwd = process.cwd();

  if (product === "all") {
    const suite = await runGoldenReferenceSuite({ cwd });
    return NextResponse.json(suite);
  }

  const result = await runReferenceProduct(product, {
    cwd,
    regenerate: true,
  });
  return NextResponse.json(result);
}
