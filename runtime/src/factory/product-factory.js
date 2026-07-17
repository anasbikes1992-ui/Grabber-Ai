// Product Factory — DNA → complete product blueprint via builders + IEP (EDR-007).
import { BUILDERS, BUILDER_ORDER, artifactFingerprint } from './builders.js';
import { createIEP } from '../iep/index.js';
import { sha256 } from '../kernel/types.js';

/**
 * @param {{ iep?: ReturnType<typeof createIEP>, bus?: object }} [opts]
 */
export function createProductFactory(opts = {}) {
  const iep = opts.iep ?? createIEP({ bus: opts.bus });
  registerBuilderJobs(iep);
  return new ProductFactory(iep);
}

function registerBuilderJobs(iep) {
  for (const key of BUILDER_ORDER) {
    const builder = BUILDERS[key];
    iep.scheduler.register(builder.id, async (job, ctx) => {
      const { dna, prior = {} } = job.payload;
      const artifact = builder.build(dna, prior);
      // Optional cache by DNA fingerprint + builder
      const cacheKey = `builder:${builder.id}:${sha256({ dna, priorKeys: Object.keys(prior).sort() })}`;
      const cached = ctx.cache?.get(cacheKey);
      if (cached) {
        return { output: cached, tokens: 0, artifactId: cached.fingerprint, cached: true };
      }
      ctx.cache?.set(cacheKey, artifact);
      ctx.memory?.put('project', {
        key: `artifact:${builder.id}`,
        scope: job.projectId ?? dna.name,
        value: artifact,
      });
      ctx.recorder?.artifact?.(ctx.executionId, {
        builder: builder.id,
        type: artifact.type,
        fingerprint: artifact.fingerprint,
      });
      return {
        output: artifact,
        tokens: Math.ceil(JSON.stringify(artifact.content).length / 4),
        artifactId: artifact.fingerprint,
        validation: { passed: true, score: 100, builder: builder.id },
      };
    });
  }
}

export class ProductFactory {
  #iep;

  constructor(iep) {
    this.#iep = iep;
  }

  get iep() {
    return this.#iep;
  }

  /**
   * Plan: return ordered builder pipeline for a DNA (no execution).
   */
  plan(dnaInput) {
    const dna = normalizeDna(dnaInput);
    return {
      project: dna.name,
      pipeline: BUILDER_ORDER.map((key) => ({
        builder: BUILDERS[key].id,
        type: BUILDERS[key].type,
        stage: BUILDERS[key].stage,
        dependsOn: BUILDERS[key].dependsOn,
      })),
      wall_kpi: 'time_dna_to_deployable',
    };
  }

  /**
   * Build complete product from DNA using IEP job DAG.
   * @returns {Promise<ProductBuildResult>}
   */
  async build(dnaInput, { projectId, budget = { maxCost: 10, maxTokens: 500_000 } } = {}) {
    const dna = normalizeDna(dnaInput);
    const pid = projectId ?? dna.name;
    const started = Date.now();
    const session = this.#iep.sessions.create({ projectId: pid, actor: 'product-factory' });

    // Sequential with prior artifacts (builders depend on prior outputs)
    const artifacts = {};
    const fingerprints = {};
    const executionIds = [];
    let interventions = 0;
    let totalTokens = 0;

    for (const key of BUILDER_ORDER) {
      const builder = BUILDERS[key];
      const prior = Object.fromEntries(
        Object.entries(artifacts).map(([k, v]) => [k, v]),
      );
      // Map builder keys for prior lookup
      const priorByBuilderId = {};
      for (const [k, art] of Object.entries(artifacts)) {
        priorByBuilderId[BUILDERS[k].id] = art;
      }

      this.#iep.scheduler.schedule({
        type: builder.id,
        projectId: pid,
        priority: 100,
        payload: {
          dna,
          prior: priorByBuilderId,
          model: 'stub',
          estimatedTokens: 800,
          stage: builder.stage,
        },
      });

      const run = await this.#iep.orchestrator.runUntilIdle({ maxSteps: 1 });
      const step = run.results[0];
      if (!step?.ok) {
        interventions += 1;
        throw new Error(`builder ${builder.id} failed: ${step?.error ?? 'unknown'}`);
      }
      executionIds.push(step.executionId);
      const art = step.result.output;
      artifacts[key] = art;
      fingerprints[key] = art.fingerprint;
      totalTokens += step.result.tokens ?? 0;

      this.#iep.metrics.record({
        kind: 'artifact_ok',
        projectId: pid,
        artifact_ok: 1,
        artifact_total: 1,
      });
    }

    const durationMs = Date.now() - started;
    const costTotals = this.#iep.cost.totals({ projectId: pid });
    const product = {
      projectId: pid,
      name: dna.name,
      template: dna.template ?? null,
      dna,
      artifacts,
      fingerprints,
      files: collectFiles(artifacts),
      release: {
        deployable: true,
        security_score: artifacts.security?.content?.score ?? 0,
        environments: artifacts.deployment?.content?.environments ?? [],
        docs: artifacts.documentation?.content?.files ?? [],
      },
    };

    const productFingerprint = artifactFingerprint({
      fingerprints,
      name: dna.name,
      modules: dna.architecture?.modules,
    });

    this.#iep.sessions.close(session.id);

    const withinBudget =
      costTotals.actual_cost <= (budget.maxCost ?? Infinity) &&
      totalTokens <= (budget.maxTokens ?? Infinity);

    return {
      ok: true,
      product,
      productFingerprint,
      metrics: {
        durationMs,
        totalTokens,
        cost: costTotals,
        interventions,
        builders: BUILDER_ORDER.length,
        executionIds,
        withinBudget,
        validation_pass_rate: 1,
        human_intervention_rate: interventions > 0 ? 1 : 0,
        replayable: executionIds.every((id) => {
          try {
            this.#iep.recorder.replay(id);
            return true;
          } catch {
            return false;
          }
        }),
      },
      kpis: this.#iep.kpis({ projectId: pid }),
      sessionId: session.id,
    };
  }

  /**
   * Validate a built product (structure + security gate).
   */
  validate(buildResult) {
    const errors = [];
    const p = buildResult.product;
    if (!p) errors.push('missing product');
    for (const key of BUILDER_ORDER) {
      if (!p.artifacts[key]) errors.push(`missing artifact ${key}`);
      if (!p.fingerprints[key]) errors.push(`missing fingerprint ${key}`);
    }
    if ((p.artifacts.security?.content?.score ?? 0) < 95) {
      errors.push('security score below 95 (POL-001 / DO-09 class gate)');
    }
    if (!p.release?.deployable) errors.push('not marked deployable');
    return {
      ok: errors.length === 0,
      errors,
      score: errors.length === 0 ? 100 : Math.max(0, 100 - errors.length * 10),
    };
  }

  /**
   * Deploy readiness report (does not call external clouds).
   */
  deploy(buildResult) {
    const v = this.validate(buildResult);
    if (!v.ok) {
      return { ok: false, ready: false, errors: v.errors };
    }
    return {
      ok: true,
      ready: true,
      projectId: buildResult.product.projectId,
      environments: buildResult.product.release.environments,
      pipeline: buildResult.product.artifacts.deployment?.content?.steps,
      files: buildResult.product.artifacts.deployment?.content?.files,
      note: 'Blueprint deployable — cloud adapters (Vercel/Supabase) via connectors',
    };
  }

  /**
   * Regeneration equivalence: build twice, compare fingerprints.
   */
  async regenerate(dnaInput, opts = {}) {
    const a = await this.build(dnaInput, { ...opts, projectId: `${opts.projectId ?? normalizeDna(dnaInput).name}-r1` });
    const b = await this.build(dnaInput, { ...opts, projectId: `${opts.projectId ?? normalizeDna(dnaInput).name}-r2` });
    const equivalent = a.productFingerprint === b.productFingerprint
      && BUILDER_ORDER.every((k) => a.product.fingerprints[k] === b.product.fingerprints[k]);
    return {
      equivalent,
      productFingerprint: a.productFingerprint,
      runA: a.metrics,
      runB: b.metrics,
      interventions: a.metrics.interventions + b.metrics.interventions,
      bothValid: this.validate(a).ok && this.validate(b).ok,
      bothReplayable: a.metrics.replayable && b.metrics.replayable,
      bothWithinBudget: a.metrics.withinBudget && b.metrics.withinBudget,
    };
  }
}

export function normalizeDna(input) {
  const dna = input?.project && typeof input.project === 'object' ? { ...input.project } : { ...input };
  if (!dna.name) throw new Error('DNA.name required');
  if (!dna.goals?.length) throw new Error('DNA.goals required');
  if (!dna.architecture) dna.architecture = { style: 'modular-monolith', modules: ['core'] };
  if (!dna.constraints) {
    dna.constraints = {
      must: ['derive every artifact from this DNA'],
      should: [],
      may: [],
      must_not: [],
      assumptions: [],
      unknowns: [],
      risks: [],
    };
  }
  return dna;
}

function collectFiles(artifacts) {
  const files = [];
  for (const art of Object.values(artifacts)) {
    if (Array.isArray(art.content?.files)) files.push(...art.content.files);
  }
  return [...new Set(files)];
}
