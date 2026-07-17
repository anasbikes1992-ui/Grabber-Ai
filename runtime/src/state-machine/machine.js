// state-machine/machine.js — Project State Machine (docs/07).
// The only authority on "where a project is". Transitions ONLY on gate
// events (SM-01); loopback on failure (SM-02); escalation after two
// consecutive failures (Article VI); invariants checked on every mutation.

export const STAGES = [
  'intake', 'discovery', 'analysis', 'requirements', 'architecture',
  'planning', 'design_system', 'data_architecture', 'development',
  'verification', 'security', 'performance', 'deployment', 'monitoring',
  'improvement', 'closed',
];

export class ProjectStateMachine {
  #projects = new Map();

  constructor(bus, { gateThresholds = {} } = {}) {
    this.bus = bus;
    this.gateThresholds = gateThresholds; // stage -> threshold (01-OS §3)
  }

  createProject({ id, dna }) {
    if (this.#projects.has(id)) throw new Error(`project ${id} already exists (INV-1)`);
    const p = { id, dna, stage: 'intake', condition: 'active', failures: {}, history: [] };
    this.#projects.set(id, p);
    this.bus.emit({ type: 'project.created', project: id, stage: 'intake', actor: 'state-machine' });
    return p;
  }

  stageOf(projectId) { return this.#must(projectId).stage; }
  conditionOf(projectId) { return this.#must(projectId).condition; }
  projectDna(projectId) { return this.#must(projectId).dna; }

  /** SM-01: the ONLY way forward. */
  gatePassed(projectId, stage, { score, actor = 'validation-runtime' }) {
    const p = this.#must(projectId);
    this.#assertActive(p);
    if (p.stage !== stage) throw new Error(`gate for "${stage}" but project is in "${p.stage}" (INV-1)`);
    const threshold = this.gateThresholds[stage] ?? 90;
    if (score < threshold) throw new Error(`gate.passed emitted with score ${score} below threshold ${threshold} — refuse (Article VII.2: scores are computed, not asserted)`);
    p.failures[stage] = 0;
    const next = STAGES[STAGES.indexOf(stage) + 1];
    // EDR-003 finding F-1: SM-06 applies to ANY transition into `closed`,
    // not only to close() — otherwise gatePassed(improvement) bypasses it.
    if (next === 'closed') this.#assertLearningMerged(projectId);
    this.bus.emit({ type: 'gate.passed', project: projectId, stage, actor, payload: { score, threshold } });
    this.#transition(p, next, `gate.passed(${stage})`);
    return next;
  }

  /** SM-02: loopback with correction list; two consecutive failures escalate. */
  gateFailed(projectId, stage, { score, corrections = [], actor = 'validation-runtime' }) {
    const p = this.#must(projectId);
    if (p.stage !== stage) throw new Error(`gate for "${stage}" but project is in "${p.stage}" (INV-1)`);
    p.failures[stage] = (p.failures[stage] ?? 0) + 1;
    this.bus.emit({ type: 'gate.failed', project: projectId, stage, actor, payload: { score, corrections } });
    if (p.failures[stage] >= 2) {
      p.condition = 'escalated';
      this.bus.emit({ type: 'task.escalated', project: projectId, stage, actor: 'state-machine', payload: { reason: 'two consecutive gate failures (Article VI)' } });
      return 'escalated';
    }
    this.bus.emit({ type: 'state.loopback', project: projectId, stage, actor: 'state-machine', payload: { corrections } });
    return 'loopback';
  }

  /** Human/owner resolution exits escalation (docs/07 §1). */
  resolveEscalation(projectId, actor) {
    const p = this.#must(projectId);
    if (p.condition !== 'escalated') throw new Error('project is not escalated');
    p.condition = 'active';
    this.bus.emit({ type: 'state.transitioned', project: projectId, stage: p.stage, actor, payload: { condition: 'active', resolved: true } });
  }

  /** SM-06: closure requires learning merged. */
  close(projectId, actor) {
    const p = this.#must(projectId);
    this.#assertLearningMerged(projectId);
    this.#transition(p, 'closed', 'learning merged');
  }

  #assertLearningMerged(projectId) {
    const merged = this.bus.replay((e) => e.project === projectId && e.type === 'knowledge.entry_merged').length > 0;
    const reported = this.bus.replay((e) => e.project === projectId && e.type === 'learning.report_ready').length > 0;
    if (!merged || !reported) {
      throw new Error('cannot close: learning report not merged (SM-06, Article III.3)');
    }
  }

  #transition(p, next, cause) {
    if (!STAGES.includes(next)) throw new Error(`unknown stage "${next}"`);
    const from = p.stage;
    p.stage = next;
    p.history.push({ from, to: next, cause, at: new Date().toISOString() }); // INV-2 (also in event log)
    this.bus.emit({ type: 'state.transitioned', project: p.id, stage: next, actor: 'state-machine', payload: { from, cause } });
  }

  #assertActive(p) {
    if (p.condition === 'escalated') throw new Error('project escalated: no Building-layer progress until resolved (INV-4)');
    if (p.condition !== 'active') throw new Error(`project is ${p.condition}`);
  }

  #must(id) {
    const p = this.#projects.get(id);
    if (!p) throw new Error(`unknown project ${id}`);
    return p;
  }
}
