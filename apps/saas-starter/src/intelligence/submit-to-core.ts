/**
 * Bridge: Product Intelligence → Grabber Core Product Factory.
 * Dynamic import keeps Next client bundles free of Core runtime.
 */
import type { IntelligenceResult } from "./types";

export type CoreSubmitResult = {
  ok: boolean;
  productFingerprint?: string;
  durationMs?: number;
  interventions?: number;
  builders?: number;
  error?: string;
  metrics?: Record<string, unknown>;
};

export async function submitHandoffToCore(
  result: IntelligenceResult,
): Promise<CoreSubmitResult> {
  if (!result.ok) {
    return { ok: false, error: result.errors.join("; ") };
  }

  try {
    // Relative path from apps/saas-starter → monorepo runtime
    const factoryMod = (await import(
      /* webpackIgnore: true */
      "../../../../runtime/src/factory/index.js"
    )) as {
      createProductFactory: () => {
        build: (
          dna: unknown,
          opts?: { projectId?: string },
        ) => Promise<{
          productFingerprint: string;
          metrics: {
            durationMs: number;
            interventions: number;
            builders: number;
          };
        }>;
        validate: (build: unknown) => { ok: boolean; errors: string[] };
      };
    };
    const factory = factoryMod.createProductFactory();
    const build = await factory.build(result.dna, {
      projectId: result.dna.project.name,
    });
    const validation = factory.validate(build);
    if (!validation.ok) {
      return {
        ok: false,
        error: validation.errors.join("; "),
        metrics: build.metrics,
      };
    }
    return {
      ok: true,
      productFingerprint: build.productFingerprint,
      durationMs: build.metrics.durationMs,
      interventions: build.metrics.interventions,
      builders: build.metrics.builders,
      metrics: build.metrics as unknown as Record<string, unknown>,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
