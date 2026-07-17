import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type {
  FactoryRegistry,
  ModuleBuilder,
  ModuleFragment,
  RegistryEntry,
} from "./types";

export function modulesRoot(cwd = process.cwd()): string {
  const candidates = [
    join(cwd, "modules"),
    join(cwd, "apps/saas-starter/modules"),
  ];
  for (const c of candidates) {
    if (existsSync(join(c, "registry.json"))) return c;
  }
  return join(cwd, "modules");
}

export function loadRegistry(cwd = process.cwd()): FactoryRegistry {
  const root = modulesRoot(cwd);
  const raw = JSON.parse(
    readFileSync(join(root, "registry.json"), "utf8"),
  ) as FactoryRegistry;
  return raw;
}

export function listRegisteredModules(cwd = process.cwd()): string[] {
  return Object.keys(loadRegistry(cwd).modules).sort();
}

export function getRegistryEntry(
  name: string,
  cwd = process.cwd(),
): RegistryEntry | null {
  return loadRegistry(cwd).modules[name] ?? null;
}

export function loadModuleBuilder(
  name: string,
  cwd = process.cwd(),
): ModuleBuilder {
  const root = modulesRoot(cwd);
  const path = join(root, name, "builder.json");
  return JSON.parse(readFileSync(path, "utf8")) as ModuleBuilder;
}

export function loadModuleFragment(
  name: string,
  cwd = process.cwd(),
): ModuleFragment {
  const root = modulesRoot(cwd);
  const path = join(root, name, "project-dna.fragment.json");
  return JSON.parse(readFileSync(path, "utf8")) as ModuleFragment;
}

export function discoverModuleDirs(cwd = process.cwd()): string[] {
  const root = modulesRoot(cwd);
  return readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name)
    .filter((n) => existsSync(join(root, n, "builder.json")));
}
