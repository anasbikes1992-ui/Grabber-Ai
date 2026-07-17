import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Blueprint, BlueprintRegistry } from "./types";

export function blueprintsRoot(cwd = process.cwd()): string {
  const candidates = [
    join(cwd, "blueprints"),
    join(cwd, "apps/saas-starter/blueprints"),
  ];
  for (const c of candidates) {
    if (existsSync(join(c, "registry.json"))) return c;
  }
  return join(cwd, "blueprints");
}

export function loadBlueprintRegistry(cwd = process.cwd()): BlueprintRegistry {
  const root = blueprintsRoot(cwd);
  return JSON.parse(
    readFileSync(join(root, "registry.json"), "utf8"),
  ) as BlueprintRegistry;
}

export function listBlueprints(cwd = process.cwd()): string[] {
  return Object.keys(loadBlueprintRegistry(cwd).blueprints).sort();
}

export function loadBlueprint(
  id: string,
  cwd = process.cwd(),
): Blueprint {
  const root = blueprintsRoot(cwd);
  const reg = loadBlueprintRegistry(cwd);
  const entry = reg.blueprints[id];
  if (!entry) throw new Error(`Unknown blueprint "${id}"`);
  const path = join(root, entry.path.replace(/^\.\//, ""), "blueprint.json");
  return JSON.parse(readFileSync(path, "utf8")) as Blueprint;
}

export function goldenBlueprints(cwd = process.cwd()): string[] {
  const reg = loadBlueprintRegistry(cwd);
  return Object.entries(reg.blueprints)
    .filter(([, v]) => v.golden)
    .map(([k]) => k)
    .sort();
}
