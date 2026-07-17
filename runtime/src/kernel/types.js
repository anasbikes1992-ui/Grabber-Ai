// kernel/types.js — shared contracts (docs/04 §4, docs/06 §1-2)
// Single source of truth for envelopes, catalogues, and layer separation.
import { createHash, randomUUID } from 'node:crypto';

export const newId = (prefix) => `${prefix}_${randomUUID()}`;
export const sha256 = (value) =>
  createHash('sha256').update(canonical(value)).digest('hex');

/** Canonical JSON: stable key order → deterministic hashes (CE-01). */
export function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
}

// ── Event catalogue (docs/04 §4) ─────────────────────────────────────────
export const EVENT_TYPES = new Set([
  'project.created', 'project.dna_changed', 'project.closed',
  'task.created', 'task.dispatched', 'task.completed', 'task.failed', 'task.escalated',
  'artifact.produced', 'artifact.validated', 'artifact.approved', 'artifact.superseded',
  'gate.passed', 'gate.failed', 'gate.exception_granted',
  'state.transitioned', 'state.loopback', 'state.blocked',
  'governance.conflict_detected', 'governance.amendment_proposed', 'governance.policy_triggered',
  'learning.report_ready', 'knowledge.entry_merged',
]);

export function makeEvent({ type, project, stage = '', subject = '', actor, payload = {}, causationId = '', correlationId = '' }) {
  if (!EVENT_TYPES.has(type)) throw new Error(`Unknown event type "${type}" — extend the catalogue via minor version bump (docs/04 §4)`);
  if (!project) throw new Error('event.project is required');
  if (!actor) throw new Error('event.actor is required (Article V: no anonymous actions)');
  return Object.freeze({
    id: newId('evt'), type, project, stage, subject, actor,
    payload: Object.freeze({ ...payload }),
    causation_id: causationId, correlation_id: correlationId || newId('cor'),
    occurred_at: new Date().toISOString(),
  });
}

// ── Artifact types → producing layer (docs/06 §1, Article VI) ────────────
export const ARTIFACT_LAYER = Object.freeze({
  'document.prd': 'thinking',
  'document.architecture': 'thinking',
  'document.edr': 'thinking',
  'document.plan': 'thinking',
  'design.system': 'thinking',
  'schema.database': 'building',
  'schema.migration': 'building',
  'contract.api': 'building',
  'code.module': 'building',
  'suite.test': 'building',
  'config.pipeline': 'building',
  'docs.delivered': 'building',
  'report.validation': 'verification',
  'report.security': 'verification',
  'report.learning': 'verification',
  'knowledge.entry': 'learning',
});

export const ARTIFACT_STATES = ['draft', 'validated', 'failed', 'approved', 'merged', 'active', 'superseded', 'archived'];

/** Validate an artifact envelope (docs/06 §2). Returns [] when valid. */
export function validateArtifactEnvelope(a) {
  const errors = [];
  const req = (cond, msg) => { if (!cond) errors.push(msg); };
  req(a && typeof a === 'object', 'artifact must be an object');
  if (errors.length) return errors;
  req(ARTIFACT_LAYER[a.type], `unknown artifact type "${a.type}" (docs/06 §1 — agents cannot invent types, AG-03)`);
  req(a.project, 'artifact.project required');
  req(a.stage, 'artifact.stage required');
  req(a.producer?.agent, 'producer.agent required (Article V)');
  req(a.producer?.prompt_version, 'producer.prompt_version required (OB-10)');
  req(a.producer?.standards_version, 'producer.standards_version required (OB-10)');
  req(a.producer?.context_bundle, 'producer.context_bundle required (CE-06)');
  req(Array.isArray(a.inputs), 'inputs must be an array of artifact ids');
  req(Array.isArray(a.related_standards), 'related_standards must be an array of rule ids');
  req(Array.isArray(a.derives_from) && a.derives_from.length > 0,
    'derives_from must trace to Project DNA sections (AM-04/AM-06 — no reason to exist otherwise)');
  req(a.content !== undefined, 'content required');
  return errors;
}

// ── Constraint block (18-PROMPT PR-04, Constraint Engine) ────────────────
export const CONSTRAINT_KEYS = ['must', 'should', 'may', 'must_not', 'assumptions', 'unknowns', 'risks'];
export function validateConstraintBlock(c) {
  if (!c || typeof c !== 'object') return ['constraint block missing (PR-04)'];
  return CONSTRAINT_KEYS.filter((k) => !Array.isArray(c[k])).map((k) => `constraints.${k} must be an array (PR-04)`);
}
