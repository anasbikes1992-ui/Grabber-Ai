/** Product Intelligence Layer types (Sprint 2). Product-side only. */

export type ClientRequest = {
  text: string;
  industry?: string;
  business_model?: string;
  locale?: string;
  name_hint?: string;
};

export type Requirements = {
  goals: string[];
  users: { role: string; goals: string[] }[];
  critical_flows: string[];
  acceptance: { id: string; statement: string }[];
  unknowns: string[];
  risks: string[];
};

export type Feature = {
  id: string;
  label: string;
  category:
    | "core"
    | "auth"
    | "billing"
    | "workflow"
    | "content"
    | "integration"
    | "ops";
  priority: "must" | "should" | "may";
};

export type FeatureClassification = {
  features: Feature[];
  modules: string[];
  integrations: string[];
};

export type ProjectDnaDocument = {
  project: {
    name: string;
    template: string;
    industry: string;
    business_model: string;
    users: { role: string; goals: string[] }[];
    goals: string[];
    constraints: {
      must: string[];
      should: string[];
      may: string[];
      must_not: string[];
      assumptions: string[];
      unknowns: string[];
      risks: string[];
    };
    integrations: string[];
    architecture: { style: string; modules: string[] };
    stack: string;
    conventions: {
      db_naming: string;
      api_envelope: string;
      breakpoints: string[];
    };
    security_level: string;
    authorization: { model: string; roles: string[] };
    accessibility_level: string;
    performance_targets: {
      lcp_ms: number;
      inp_ms: number;
      api_p95_ms: number;
    };
    data: { retention: string; regulated: boolean };
    deployment_targets: {
      environments: string[];
      uptime_target: string;
      backup_schedule: string;
    };
    critical_flows: string[];
    standards_version: string;
    decision_registry: string[];
    intelligence: {
      layer_version: string;
      prompt_versions: Record<string, string>;
      source_request_hash: string;
    };
  };
};

export type BuilderJob = {
  type: string;
  stage: string;
  dependsOn: string[];
};

export type DnaToCoreHandoff = {
  kind: "dna-to-core";
  version: string;
  dna: ProjectDnaDocument;
  builder_jobs: BuilderJob[];
  submit_to: "grabber-core/product-factory";
};

export type IntelligenceResult = {
  ok: boolean;
  requirements: Requirements;
  classification: FeatureClassification;
  dna: ProjectDnaDocument;
  handoff: DnaToCoreHandoff;
  prompts_used: { id: string; version: string }[];
  errors: string[];
};
