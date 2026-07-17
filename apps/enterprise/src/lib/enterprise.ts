/**
 * Bridge to @grabber/enterprise domain (Track B).
 * Server-only — pure Node ESM package outside Next bundler.
 */
import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { existsSync } from "node:fs";

export function monorepoCwd() {
  // apps/enterprise → grabber-ai-studio root
  return join(process.cwd(), "..", "..");
}

export function ensureEnterpriseDataDir() {
  if (!process.env.GRABBER_ENTERPRISE_DIR) {
    process.env.GRABBER_ENTERPRISE_DIR = join(
      monorepoCwd(),
      ".grabber",
      "enterprise",
    );
  }
  return process.env.GRABBER_ENTERPRISE_DIR;
}

export async function ent() {
  ensureEnterpriseDataDir();
  const candidates = [
    join(monorepoCwd(), "packages", "enterprise", "src", "index.js"),
    join(process.cwd(), "..", "..", "packages", "enterprise", "src", "index.js"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      return import(/* webpackIgnore: true */ pathToFileURL(p).href);
    }
  }
  throw new Error("@grabber/enterprise package not found");
}

export function jsonOk(data: unknown, status = 200) {
  return Response.json({ ok: true, ...((data as object) || {}) }, { status });
}

export function jsonErr(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : String(error);
  const safeMessage = status >= 500 ? "Internal server error" : message;
  return Response.json({ ok: false, error: safeMessage }, { status });
}
