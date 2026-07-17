import { loadModuleBuilder, loadRegistry } from "./registry";
import type { CompatibilityIssue, CompatibilityReport } from "./types";

/**
 * Resolve module graph: auto-add requires, detect conflicts, check supports.
 */
export function resolveModuleCompatibility(
  requested: string[],
  opts: { productType?: string; cwd?: string } = {},
): CompatibilityReport {
  const cwd = opts.cwd ?? process.cwd();
  const productType = (opts.productType ?? "saas").toLowerCase();
  const registry = loadRegistry(cwd);
  const issues: CompatibilityIssue[] = [];
  const selected = unique(requested.map(normalizeAlias));

  // Expand requires until fixed point
  const resolvedSet = new Set<string>(selected);
  let changed = true;
  while (changed) {
    changed = false;
    for (const name of [...resolvedSet]) {
      const entry = registry.modules[name];
      if (!entry) {
        issues.push({
          severity: "error",
          code: "UNKNOWN_MODULE",
          message: `Module "${name}" is not in the Factory Registry`,
          module: name,
        });
        continue;
      }
      for (const req of entry.requires) {
        if (!resolvedSet.has(req)) {
          resolvedSet.add(req);
          changed = true;
        }
      }
      if (entry.supports.length && !entry.supports.includes(productType)) {
        // soft: warning if supports is non-empty and product type not listed
        // allow "saas" modules on unknown types with warning only when clearly mismatched
        if (
          !entry.supports.includes("saas") ||
          !["saas", "generic"].includes(productType)
        ) {
          if (!entry.supports.includes(productType)) {
            issues.push({
              severity: "warning",
              code: "SUPPORTS_MISMATCH",
              message: `Module "${name}" supports [${entry.supports.join(", ")}], product type is "${productType}"`,
              module: name,
            });
          }
        }
      }
    }
  }

  // Conflicts
  for (const name of resolvedSet) {
    const entry = registry.modules[name];
    if (!entry) continue;
    for (const c of entry.conflicts) {
      if (resolvedSet.has(c)) {
        issues.push({
          severity: "error",
          code: "CONFLICT",
          message: `Module "${name}" conflicts with "${c}"`,
          module: name,
        });
      }
    }
  }

  // Topological order by requires
  const resolved = topoSort([...resolvedSet], (name) => {
    const entry = registry.modules[name];
    return entry?.requires ?? [];
  });

  // Verify builders load
  for (const name of resolved) {
    if (!registry.modules[name]) continue;
    try {
      loadModuleBuilder(name, cwd);
    } catch {
      issues.push({
        severity: "error",
        code: "BUILDER_MISSING",
        message: `builder.json missing or invalid for "${name}"`,
        module: name,
      });
    }
  }

  const ok = !issues.some((i) => i.severity === "error");
  return { ok, selected, resolved, issues };
}

/** Map intake/legacy module names onto registry ids */
export function normalizeAlias(name: string): string {
  const n = name.toLowerCase().replace(/^module\./, "");
  const map: Record<string, string> = {
    users: "authentication",
    auth: "authentication",
    tenant: "teams",
    tenants: "teams",
    core: "authentication",
    bookings: "booking",
    deals: "crm",
    contacts: "customers",
    companies: "customers",
    activities: "crm",
    workflows: "crm",
    stock: "inventory",
    catalog: "products",
  };
  return map[n] ?? n;
}

function unique(xs: string[]): string[] {
  return [...new Set(xs.filter(Boolean))];
}

function topoSort(
  nodes: string[],
  depsOf: (n: string) => string[],
): string[] {
  const set = new Set(nodes);
  const indeg = new Map<string, number>();
  for (const n of nodes) indeg.set(n, 0);
  for (const n of nodes) {
    for (const d of depsOf(n)) {
      if (set.has(d)) indeg.set(n, (indeg.get(n) ?? 0) + 1);
    }
  }
  const q = nodes.filter((n) => (indeg.get(n) ?? 0) === 0).sort();
  const out: string[] = [];
  const temp = new Map(nodes.map((n) => [n, new Set(depsOf(n).filter((d) => set.has(d)))]));

  while (q.length) {
    const n = q.shift()!;
    out.push(n);
    for (const [other, deps] of temp) {
      if (deps.has(n)) {
        deps.delete(n);
        if (deps.size === 0 && !out.includes(other) && !q.includes(other)) {
          q.push(other);
          q.sort();
        }
      }
    }
  }

  // cycle fallback: append remaining
  for (const n of nodes) {
    if (!out.includes(n)) out.push(n);
  }
  return out;
}
