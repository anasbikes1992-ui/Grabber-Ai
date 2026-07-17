// context/engine.js — Context Engine (docs/05).
// Deterministic (CE-01), complete (CE-02), minimal (CE-03), referenced
// (CE-04), unknown-safe (CE-05), provenanced (CE-06) bundles.
import { newId, sha256, validateConstraintBlock } from '../kernel/types.js';

export class ContextEngine {
  constructor({ standardsVersion }) {
    this.standardsVersion = standardsVersion;
    this.bundles = new Map(); // CE-06: bundles are stored, queryable
  }

  /**
   * Assemble a validated context bundle.
   * Throws BundleRejection before dispatch on any docs/05 §4 violation.
   */
  assemble({ task, agent, dnaSections, constraints, standards, knowledge = [], decisions = [], artifacts = [], memory = [], outputContract, budgetTokens = 100_000 }) {
    const errors = [];
    errors.push(...validateConstraintBlock(constraints)); // PR-04
    if (!outputContract?.type) errors.push('output contract missing (docs/05 §4)');
    if (!Array.isArray(standards) || standards.length === 0) errors.push('no bound standards resolved (docs/05 §4)');
    for (const s of standards ?? []) {
      if (!s.id || !s.version || !Array.isArray(s.rules)) errors.push(`standard reference malformed: ${JSON.stringify(s)} (CE-04: reference + applicable rules)`);
    }
    if (!dnaSections || Object.keys(dnaSections).length === 0) errors.push('no Project DNA sections (AM-04: everything derives from DNA)');

    // CE-03: fixed pruning priority; decision-bearing items are never pruned.
    const decisionBearing = { constraints, outputContract, standards };
    if (approxTokens(decisionBearing) > budgetTokens) {
      errors.push('decision-bearing set exceeds budget — split the task via Planner, never truncate (CE-03)');
    }
    if (errors.length) throw new BundleRejection(errors);

    let pruned = { knowledge, decisions, artifacts, memory };
    for (const key of ['memory', 'knowledge', 'decisions', 'artifacts']) { // reverse priority
      while (approxTokens({ ...decisionBearing, ...pruned, dnaSections }) > budgetTokens && pruned[key].length) {
        pruned = { ...pruned, [key]: pruned[key].slice(0, -1) };
      }
    }

    const inputs = { task: task.type, agent, dnaSections, constraints, standards, ...pruned, outputContract };
    const bundle = Object.freeze({
      id: newId('ctx'),
      task, agent,
      project_dna: dnaSections,
      constraints, standards,
      knowledge: pruned.knowledge, decisions: pruned.decisions,
      artifacts: pruned.artifacts, memory: pruned.memory,
      output_contract: outputContract,
      budget: { tokens: budgetTokens },
      provenance: Object.freeze({
        assembled_at: new Date().toISOString(),
        assembler_version: '0.1.0',
        standards_version: this.standardsVersion,
        inputs_hash: sha256(inputs), // CE-01: replayable determinism
      }),
    });
    this.bundles.set(bundle.id, bundle);
    return bundle;
  }

  get(id) { return this.bundles.get(id); }
}

export class BundleRejection extends Error {
  constructor(errors) {
    super(`bundle rejected pre-dispatch:\n- ${errors.join('\n- ')}`);
    this.name = 'BundleRejection';
    this.errors = errors;
  }
}

const approxTokens = (obj) => Math.ceil(JSON.stringify(obj).length / 4);
