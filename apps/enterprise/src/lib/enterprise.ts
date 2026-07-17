/**
 * Bridge to @grabber/enterprise domain (Track B).
 * Server-only domain loader with runtime fallback paths.
 */
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const require = createRequire(import.meta.url);

export function monorepoCwd() {
  // apps/enterprise → grabber-ai-studio root
  return join(process.cwd(), "..", "..");
}

export function ensureEnterpriseDataDir() {
  if (process.env.GRABBER_ENTERPRISE_DIR) return process.env.GRABBER_ENTERPRISE_DIR;

  // Serverless filesystems are read-only except tmp storage.
  const useTempStorage = process.env.VERCEL === "1";
  const dataDir = useTempStorage
    ? join(tmpdir(), "grabber-enterprise")
    : join(monorepoCwd(), ".grabber", "enterprise");

  mkdirSync(dataDir, { recursive: true });
  process.env.GRABBER_ENTERPRISE_DIR = dataDir;

  return process.env.GRABBER_ENTERPRISE_DIR;
}

export async function ent() {
  ensureEnterpriseDataDir();

  try {
    return import("@grabber/enterprise");
  } catch {
    // Fall back to direct filesystem resolution when the package is not bundled.
  }

  try {
    const resolved = require.resolve("@grabber/enterprise");
    return import(/* webpackIgnore: true */ pathToFileURL(resolved).href);
  } catch {
    // Fall back to repo and node_modules path candidates when package resolution fails.
  }

  const candidates = [
    join(monorepoCwd(), "packages", "enterprise", "src", "index.js"),
    join(process.cwd(), "..", "..", "packages", "enterprise", "src", "index.js"),
    join(process.cwd(), "node_modules", "@grabber", "enterprise", "src", "index.js"),
    join(process.cwd(), "node_modules", "@grabber", "enterprise", "index.js"),
    join(process.cwd(), ".next", "server", "node_modules", "@grabber", "enterprise", "src", "index.js"),
  ];

  for (const filePath of candidates) {
    if (existsSync(filePath)) {
      return import(/* webpackIgnore: true */ pathToFileURL(filePath).href);
    }
  }

  throw new Error(
    "@grabber/enterprise package not found in runtime paths. Ensure deployment includes packages/enterprise or node_modules/@grabber/enterprise.",
  );
}

export function jsonOk(data: unknown, status = 200) {
  return Response.json({ ok: true, ...((data as object) || {}) }, { status });
}

export function jsonErr(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : String(error);
  const safeMessage = status >= 500 ? "Internal server error" : message;
  return Response.json({ ok: false, error: safeMessage }, { status });
}
