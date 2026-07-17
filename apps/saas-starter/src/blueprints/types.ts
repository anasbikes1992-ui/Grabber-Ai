/** Sprint 6 — Product Blueprints (recipes over modules). */

export type BlueprintModules = {
  required: string[];
  optional: string[];
};

export type Blueprint = {
  id: string;
  version: string;
  title: string;
  product_type: string;
  description: string;
  modules: BlueprintModules;
  integrations: {
    recommended: string[];
    required: string[];
  };
  deployment: {
    provider: string;
    environments: string[];
  };
  quality: {
    security: string;
    testing: string;
    min_dna_confidence: number;
    min_dna_completeness: number;
    min_module_reuse_rate: number;
  };
  kpis: string[];
  reference?: {
    dna?: string;
    regression?: boolean;
    sprint?: number;
  };
};

export type BlueprintRegistry = {
  version: string;
  kind: "blueprint_registry";
  blueprints: Record<
    string,
    { version: string; path: string; golden: boolean }
  >;
};

export type DeclarativeProductDna = {
  product?: {
    type?: string;
    name?: string;
    title?: string;
    blueprint?: string;
    version?: string;
  };
  project?: Record<string, unknown>;
  modules?: string[];
  integrations?: string[];
  deployment?: { provider?: string; environments?: string[] };
  quality?: Record<string, unknown>;
  constraints?: Record<string, unknown>;
  authorization?: Record<string, unknown>;
  architecture?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export type BlueprintMaterializeResult = {
  ok: boolean;
  blueprint: Blueprint;
  modules: string[];
  integrations: string[];
  product_type: string;
  quality_policy: Blueprint["quality"];
  errors: string[];
};
