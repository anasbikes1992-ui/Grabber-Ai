/** Sprint 5 — Business Module Assembly */

export type ModuleBuilder = {
  id: string;
  name: string;
  title: string;
  version: string;
  kind: "business_module";
  requires: string[];
  optional: string[];
  conflicts: string[];
  supports: string[];
  surfaces: Record<string, string>;
  artifacts: {
    entities: string[];
    endpoints: string[];
    ui: string[];
    permissions: string[];
  };
};

export type ModuleFragment = {
  module: string;
  version: string;
  contributes: {
    modules: string[];
    entities: string[];
    endpoints: string[];
    ui: string[];
    permissions: string[];
    integrations: string[];
  };
};

export type RegistryEntry = {
  version: string;
  title: string;
  path: string;
  requires: string[];
  optional: string[];
  conflicts: string[];
  supports: string[];
};

export type FactoryRegistry = {
  version: string;
  kind: "factory_registry";
  modules: Record<string, RegistryEntry>;
};

export type CompatibilityIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
  module?: string;
};

export type CompatibilityReport = {
  ok: boolean;
  selected: string[];
  resolved: string[]; // topological order including auto-required
  issues: CompatibilityIssue[];
};

export type AssembledModule = {
  name: string;
  version: string;
  title: string;
  builder: ModuleBuilder;
  fragment: ModuleFragment;
  path: string;
};

export type AssemblyResult = {
  ok: boolean;
  product_type: string;
  requested: string[];
  resolved: string[];
  modules: AssembledModule[];
  compatibility: CompatibilityReport;
  composition: {
    entities: string[];
    endpoints: string[];
    ui: string[];
    permissions: string[];
    integrations: string[];
  };
  /** Share of requested surface from registered catalog modules */
  module_reuse_rate: number;
  /** Modules that were catalog hits vs unknown names */
  reuse: {
    from_registry: number;
    unknown: string[];
    total_requested: number;
  };
  errors: string[];
};
