import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { BuilderJob, DnaToCoreHandoff, ProjectDnaDocument } from "./types";
export function loadBuilderManifest(cwd = process.cwd()): {
  version: string;
  builders: BuilderJob[];
  submit_to: string;
} {
  const candidates = [
    join(cwd, "jobs/builder-manifest.json"),
    join(cwd, "apps/saas-starter/jobs/builder-manifest.json"),
  ];
  for (const p of candidates) {
    try {
      const raw = JSON.parse(readFileSync(p, "utf8")) as {
        version: string;
        submit_to: string;
        builders: BuilderJob[];
      };
      return raw;
    } catch {
      /* next */
    }
  }
  // Fallback aligned with Core Product Factory order
  return {
    version: "1.0.0",
    submit_to: "grabber-core/product-factory",
    builders: [
      { type: "builder.discovery", stage: "discovery", dependsOn: [] },
      {
        type: "builder.requirements",
        stage: "requirements",
        dependsOn: ["builder.discovery"],
      },
      {
        type: "builder.architecture",
        stage: "architecture",
        dependsOn: ["builder.requirements"],
      },
      {
        type: "builder.api",
        stage: "development",
        dependsOn: ["builder.architecture"],
      },
      {
        type: "builder.database",
        stage: "development",
        dependsOn: ["builder.architecture"],
      },
      {
        type: "builder.frontend",
        stage: "development",
        dependsOn: ["builder.api"],
      },
      {
        type: "builder.backend",
        stage: "development",
        dependsOn: ["builder.api", "builder.database"],
      },
      {
        type: "builder.tests",
        stage: "verification",
        dependsOn: ["builder.frontend", "builder.backend"],
      },
      {
        type: "builder.security",
        stage: "security",
        dependsOn: ["builder.backend", "builder.api"],
      },
      {
        type: "builder.deployment",
        stage: "deployment",
        dependsOn: ["builder.tests", "builder.security"],
      },
      {
        type: "builder.documentation",
        stage: "deployment",
        dependsOn: ["builder.deployment", "builder.api"],
      },
    ],
  };
}

export function buildDnaToCoreHandoff(
  dna: ProjectDnaDocument,
  cwd?: string,
): DnaToCoreHandoff {
  const manifest = loadBuilderManifest(cwd);
  return {
    kind: "dna-to-core",
    version: manifest.version,
    dna,
    builder_jobs: manifest.builders,
    submit_to: "grabber-core/product-factory",
  };
}
