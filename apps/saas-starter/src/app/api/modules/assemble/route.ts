import { NextResponse } from "next/server";
import { assembleModules, listRegisteredModules } from "@/modules";

export const runtime = "nodejs";

/**
 * POST /api/modules/assemble
 * Body: { modules: string[], product_type?: string }
 *
 * DNA selects modules → Factory Registry assembles capabilities.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, errors: ["invalid JSON"] }, { status: 400 });
  }
  const b = body as { modules?: string[]; product_type?: string };
  if (!Array.isArray(b.modules) || b.modules.length === 0) {
    return NextResponse.json(
      { ok: false, errors: ["modules[] required"] },
      { status: 422 },
    );
  }

  const assembly = assembleModules(b.modules, {
    productType: b.product_type ?? "saas",
    cwd: process.cwd(),
  });

  return NextResponse.json({
    ok: assembly.ok,
    assembly,
    registry: listRegisteredModules(process.cwd()),
    errors: assembly.errors,
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    registry: listRegisteredModules(process.cwd()),
  });
}
