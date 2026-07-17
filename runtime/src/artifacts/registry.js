// artifacts/registry.js — Artifact Registry (docs/06 §5).
// The ONLY write path for artifacts. Enforces: envelope schema, layer
// separation (Article VI, mechanically), stage match (INV-3), lifecycle
// (AM-01..AM-03), immutability, checksums.
import { newId, sha256, validateArtifactEnvelope, ARTIFACT_LAYER } from '../kernel/types.js';

export class ArtifactRegistry {
  #store = new Map();

  /**
   * @param {EventBus} bus
   * @param {{stageOf: (project:string)=>string, layerOf: (agent:string)=>string}} deps
   */
  constructor(bus, { stageOf, layerOf }) {
    this.bus = bus;
    this.stageOf = stageOf;
    this.layerOf = layerOf;
  }

  /** Write a draft artifact. Throws on any contract violation. */
  put(draft) {
    const errors = validateArtifactEnvelope(draft);
    // Article VI enforced by type, not convention (AG-05):
    const requiredLayer = ARTIFACT_LAYER[draft.type];
    const producerLayer = this.layerOf(draft.producer?.agent);
    if (requiredLayer && producerLayer && producerLayer !== requiredLayer) {
      errors.push(`layer violation: ${draft.producer.agent} (${producerLayer}) may not produce ${draft.type} (${requiredLayer}) — Article VI`);
    }
    // INV-3: no artifact for a stage the project has not reached.
    const currentStage = this.stageOf(draft.project);
    if (draft.stage !== currentStage) {
      errors.push(`stage mismatch: project is in "${currentStage}", artifact claims "${draft.stage}" (INV-3)`);
    }
    if (errors.length) throw new RegistryRejection(errors);

    const artifact = {
      ...draft,
      id: newId('art'),
      version: draft.version ?? '0.1.0',
      state: 'draft',
      checksum: sha256(draft.content),
      validation: { status: 'pending', gate: draft.stage, score: null, report: null },
      superseded_by: null,
      created_at: new Date().toISOString(),
    };
    this.#store.set(artifact.id, artifact);
    this.bus.emit({ type: 'artifact.produced', project: artifact.project, stage: artifact.stage, subject: artifact.id, actor: artifact.producer.agent, payload: { type: artifact.type } });
    return artifact.id;
  }

  /** Validation Runtime attaches its report (VR-04). */
  attachValidation(id, { passed, score, reportId }) {
    const a = this.#must(id);
    a.validation = { status: passed ? 'passed' : 'failed', gate: a.stage, score, report: reportId };
    a.state = passed ? 'validated' : 'failed';
    this.bus.emit({ type: 'artifact.validated', project: a.project, stage: a.stage, subject: id, actor: 'validation-runtime', payload: { passed, score } });
    return a;
  }

  approve(id, actor) {
    const a = this.#must(id);
    if (a.validation.status !== 'passed') {
      throw new RegistryRejection([`cannot approve ${id}: validation status is "${a.validation.status}" (VR-04 — approval without validation is impossible by schema)`]);
    }
    a.state = 'approved';
    this.bus.emit({ type: 'artifact.approved', project: a.project, stage: a.stage, subject: id, actor });
    return a;
  }

  supersede(oldId, newId_, actor) {
    const a = this.#must(oldId);
    a.superseded_by = newId_;
    a.state = 'superseded';
    this.bus.emit({ type: 'artifact.superseded', project: a.project, stage: a.stage, subject: oldId, actor, payload: { by: newId_ } });
  }

  /** AM-01: only approved artifacts are consumable as inputs. */
  consumable(id) {
    const a = this.#must(id);
    return a.state === 'approved' || a.state === 'merged' || a.state === 'active';
  }

  get(id) { return this.#must(id); }
  query({ project, type, state } = {}) {
    return [...this.#store.values()].filter((a) =>
      (!project || a.project === project) && (!type || a.type === type) && (!state || a.state === state));
  }

  #must(id) {
    const a = this.#store.get(id);
    if (!a) throw new RegistryRejection([`unknown artifact ${id}`]);
    return a;
  }
}

export class RegistryRejection extends Error {
  constructor(errors) {
    super(`artifact rejected:\n- ${errors.join('\n- ')}`);
    this.name = 'RegistryRejection';
    this.errors = errors;
  }
}
