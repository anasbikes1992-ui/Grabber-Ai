/** Sprint 3 — Intake produces Project DNA (not forms). */

export type IntakeInput = {
  text: string;
  name_hint?: string;
  industry?: string;
  business_model?: string;
  locale?: string;
  /** Answers to prior clarification questions */
  clarifications?: Record<string, string>;
  /** Uploaded file names/meta only (content parsing later) */
  uploads?: { name: string; kind?: string }[];
};

export type PipelineStage =
  | "business_discovery"
  | "requirement_extraction"
  | "feature_detection"
  | "module_selection"
  | "domain_identification"
  | "architecture_selection"
  | "project_dna"
  | "cost_estimate"
  | "review"
  | "submit";

export type ScoreBar = {
  label: string;
  percent: number;
  detail?: string;
};

export type DnaQuality = {
  /** Overall readiness 0–100 */
  confidence: number;
  completeness: number;
  business_understanding: number;
  requirements: number;
  missing_information: number;
  ready_for_build: boolean;
  bars: ScoreBar[];
  clarifications_required: string[];
  warnings: string[];
  builder_warnings: string[];
};

export type CostEstimate = {
  currency: string;
  estimated_tokens: number;
  estimated_cost_usd: number;
  estimated_duration_minutes: number;
  builders: number;
  notes: string[];
};

export type RichProjectDna = {
  project: {
    name: string;
    type: string;
    industry: string;
    target: "web" | "mobile" | "web+mobile";
    template: string;
    business_model: string;
    goals: string[];
    critical_flows: string[];
    standards_version: string;
    decision_registry: string[];
  };
  business: {
    users: string[];
    user_goals: { role: string; goals: string[] }[];
    value_proposition: string;
  };
  modules: string[];
  features: {
    id: string;
    label: string;
    category: string;
    priority: "must" | "should" | "may";
  }[];
  integrations: string[];
  architecture: {
    style: string;
    stack: string;
    conventions: {
      db_naming: string;
      api_envelope: string;
      breakpoints: string[];
    };
  };
  deployment: {
    provider: string;
    environments: string[];
    uptime_target: string;
    backup_schedule: string;
  };
  quality: {
    security: "standard" | "high" | "elevated";
    testing: "required" | "recommended";
    accessibility: string;
  };
  constraints: {
    must: string[];
    should: string[];
    may: string[];
    must_not: string[];
    assumptions: string[];
    unknowns: string[];
    risks: string[];
  };
  authorization: {
    model: string;
    roles: string[];
  };
  data: {
    retention: string;
    regulated: boolean;
  };
  performance_targets: {
    lcp_ms: number;
    inp_ms: number;
    api_p95_ms: number;
  };
  intelligence: {
    layer_version: string;
    intake_version: string;
    source_request_hash: string;
    quality: DnaQuality;
  };
};

/** Legacy Core-compatible envelope for Product Factory builders. */
export type CoreCompatibleDna = {
  project: {
    name: string;
    template: string;
    industry: string;
    business_model: string;
    users: { role: string; goals: string[] }[];
    goals: string[];
    constraints: RichProjectDna["constraints"];
    integrations: string[];
    architecture: { style: string; modules: string[] };
    stack: string;
    conventions: RichProjectDna["architecture"]["conventions"];
    security_level: string;
    authorization: RichProjectDna["authorization"];
    accessibility_level: string;
    performance_targets: RichProjectDna["performance_targets"];
    data: RichProjectDna["data"];
    deployment_targets: {
      environments: string[];
      uptime_target: string;
      backup_schedule: string;
    };
    critical_flows: string[];
    standards_version: string;
    decision_registry: string[];
    type?: string;
    target?: string;
    intelligence?: Record<string, unknown>;
  };
};

export type BuilderJob = {
  type: string;
  stage: string;
  dependsOn: string[];
};

export type IntakeReview = {
  modules: string[];
  integrations: string[];
  estimated_cost: CostEstimate;
  generated_jobs: BuilderJob[];
  deployment_target: string;
  validation_warnings: string[];
  quality: DnaQuality;
};

export type IntakeResult = {
  ok: boolean;
  stage: PipelineStage;
  stages_completed: PipelineStage[];
  discovery: {
    summary: string;
    domain: string;
    industry: string;
  };
  requirements: {
    goals: string[];
    users: { role: string; goals: string[] }[];
    critical_flows: string[];
    acceptance: { id: string; statement: string }[];
    unknowns: string[];
    risks: string[];
  };
  features: RichProjectDna["features"];
  modules: string[];
  domain: string;
  architecture: RichProjectDna["architecture"];
  dna: RichProjectDna;
  core_dna: CoreCompatibleDna;
  cost: CostEstimate;
  review: IntakeReview;
  handoff: {
    kind: "dna-to-core";
    version: string;
    submit_to: "grabber-core/product-factory";
    builder_jobs: BuilderJob[];
    approved: boolean;
  };
  errors: string[];
};
