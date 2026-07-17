/**
 * Jarvis OS → Product Factory host (saas-starter).
 * Never reimplements Core — HTTP client only.
 */

const DEFAULT_BASE =
  process.env.NEXT_PUBLIC_FACTORY_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:3000";

export type FactoryCatalog = {
  version: string;
  kind: string;
  modules: {
    name: string;
    title: string;
    version: string;
    quality_score: number;
    reuse_rate: number;
    requires: string[];
    supports: string[];
    complete: boolean;
  }[];
  blueprints: {
    id: string;
    title: string;
    version: string;
    product_type: string;
    golden: boolean;
    required_modules: string[];
    min_module_reuse_rate: number;
    quality_score: number;
  }[];
  summary: {
    module_count: number;
    blueprint_count: number;
    golden_count: number;
    avg_module_quality: number;
    avg_reuse_rate: number;
  };
};

export type FactoryAnalytics = {
  version: string;
  generated_at: string;
  catalog: FactoryCatalog["summary"];
  products: { total: number; by_status: Record<string, number> };
  builds: {
    total: number;
    validation_pass_rate: number;
    avg_duration_ms: number;
    avg_module_reuse_rate: number;
    avg_dna_confidence: number;
    avg_dna_completeness: number;
    avg_interventions: number;
    avg_cost_usd: number;
    deployment_success_rate: number;
  };
  history: {
    id: string;
    at: string;
    project_name: string;
    dna_confidence: number;
    dna_completeness: number;
    module_reuse_rate?: number;
    build_duration_ms: number;
    validation_pass: boolean;
    production_url?: string;
  }[];
  trends: {
    date: string;
    builds: number;
    avg_reuse: number;
    avg_duration_ms: number;
    validation_pass_rate: number;
  }[];
};

export type FactoryStatus = {
  online: boolean;
  baseUrl: string;
  catalog?: FactoryCatalog;
  analytics?: FactoryAnalytics;
  error?: string;
};

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${DEFAULT_BASE}${path}`, {
    next: { revalidate: 15 },
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Factory ${path} → ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function factoryBaseUrl() {
  return DEFAULT_BASE;
}

export async function fetchFactoryStatus(): Promise<FactoryStatus> {
  const baseUrl = DEFAULT_BASE;
  try {
    const [cat, an] = await Promise.all([
      getJson<{ ok: boolean; catalog: FactoryCatalog }>("/api/factory/catalog"),
      getJson<{ ok: boolean; analytics: FactoryAnalytics }>(
        "/api/factory/analytics",
      ),
    ]);
    return {
      online: true,
      baseUrl,
      catalog: cat.catalog,
      analytics: an.analytics,
    };
  } catch (e) {
    return {
      online: false,
      baseUrl,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Offline demo metrics when factory host is not running */
export function offlineDemoStatus(): FactoryStatus {
  return {
    online: false,
    baseUrl: DEFAULT_BASE,
    error: "Factory host offline — showing demo surface",
    catalog: {
      version: "2.0.0",
      kind: "factory_catalog_v2",
      modules: [
        {
          name: "authentication",
          title: "Authentication",
          version: "1.0.0",
          quality_score: 100,
          reuse_rate: 1,
          requires: [],
          supports: ["saas", "booking"],
          complete: true,
        },
        {
          name: "booking",
          title: "Booking",
          version: "0.9.0",
          quality_score: 95,
          reuse_rate: 1,
          requires: ["calendar"],
          supports: ["booking"],
          complete: true,
        },
        {
          name: "calendar",
          title: "Calendar",
          version: "1.0.0",
          quality_score: 100,
          reuse_rate: 1,
          requires: ["authentication"],
          supports: ["booking"],
          complete: true,
        },
        {
          name: "payments",
          title: "Payments",
          version: "1.1.0",
          quality_score: 100,
          reuse_rate: 1,
          requires: ["authentication"],
          supports: ["booking", "marketplace"],
          complete: true,
        },
      ],
      blueprints: [
        {
          id: "saas",
          title: "SaaS Starter",
          version: "1.0.0",
          product_type: "saas",
          golden: true,
          required_modules: ["authentication", "teams", "billing"],
          min_module_reuse_rate: 0.95,
          quality_score: 98,
        },
        {
          id: "booking",
          title: "Booking",
          version: "1.0.0",
          product_type: "booking",
          golden: true,
          required_modules: ["booking", "calendar", "payments"],
          min_module_reuse_rate: 0.98,
          quality_score: 96,
        },
      ],
      summary: {
        module_count: 18,
        blueprint_count: 5,
        golden_count: 4,
        avg_module_quality: 100,
        avg_reuse_rate: 1,
      },
    },
    analytics: {
      version: "2.0.0",
      generated_at: new Date().toISOString(),
      catalog: {
        module_count: 18,
        blueprint_count: 5,
        golden_count: 4,
        avg_module_quality: 100,
        avg_reuse_rate: 1,
      },
      products: { total: 3, by_status: { deployed: 2, draft: 1 } },
      builds: {
        total: 24,
        validation_pass_rate: 1,
        avg_duration_ms: 48,
        avg_module_reuse_rate: 1,
        avg_dna_confidence: 94,
        avg_dna_completeness: 91,
        avg_interventions: 0,
        avg_cost_usd: 0.04,
        deployment_success_rate: 0.92,
      },
      history: [],
      trends: [],
    },
  };
}

export async function loadJarvisFactoryData(): Promise<FactoryStatus> {
  const live = await fetchFactoryStatus();
  if (live.online) return live;
  const demo = offlineDemoStatus();
  return { ...demo, error: live.error };
}
