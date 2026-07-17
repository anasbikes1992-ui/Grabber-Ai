import { readFileSync } from "node:fs";
import { join } from "node:path";

export type PromptMeta = {
  id: string;
  version: string;
  path: string;
  body: string;
};

const PROMPT_FILES: Record<string, string> = {
  discovery: "prompts/discovery/v1.md",
  architecture: "prompts/architecture/v1.md",
  frontend: "prompts/frontend/v1.md",
  backend: "prompts/backend/v1.md",
  testing: "prompts/testing/v1.md",
  deployment: "prompts/deployment/v1.md",
};

/** Resolve prompt-os root: app package root (parent of src). */
export function promptOsRoot(cwd = process.cwd()): string {
  // Prefer apps/saas-starter/prompt-os when cwd is app or monorepo root
  const candidates = [
    join(cwd, "prompt-os"),
    join(cwd, "apps/saas-starter/prompt-os"),
  ];
  for (const c of candidates) {
    try {
      readFileSync(join(c, "version.json"), "utf8");
      return c;
    } catch {
      /* try next */
    }
  }
  return join(cwd, "prompt-os");
}

export function loadPromptVersionCatalog(root?: string): {
  version: string;
  prompts: Record<string, string>;
} {
  const base = root ?? promptOsRoot();
  const raw = JSON.parse(readFileSync(join(base, "version.json"), "utf8")) as {
    version: string;
    prompts: Record<string, string>;
  };
  return { version: raw.version, prompts: raw.prompts };
}

export function loadPrompt(
  name: keyof typeof PROMPT_FILES,
  root?: string,
): PromptMeta {
  const base = root ?? promptOsRoot();
  const rel = PROMPT_FILES[name];
  const path = join(base, rel);
  const body = readFileSync(path, "utf8");
  const idMatch = body.match(/^id:\s*(.+)$/m);
  const verMatch = body.match(/^version:\s*(.+)$/m);
  return {
    id: idMatch?.[1]?.trim() ?? `prompt.${name}`,
    version: verMatch?.[1]?.trim() ?? "1.0.0",
    path,
    body,
  };
}

export function listPromptIds(): string[] {
  return Object.keys(PROMPT_FILES);
}
