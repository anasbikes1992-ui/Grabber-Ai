// Runtime Recorder — every execution is replayable (EDR-006).
import { newId } from '../kernel/types.js';

export class RuntimeRecorder {
  #executions = new Map();

  start({ projectId, jobId = null, agentId = null, type = 'execution', context = {} }) {
    const id = newId('exec');
    const rec = {
      id,
      projectId,
      jobId,
      agentId,
      type,
      context: structuredCloneSafe(context),
      events: [],
      artifacts: [],
      decisions: [],
      validation: [],
      outputs: [],
      failures: [],
      cost: null,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      durationMs: null,
      status: 'running',
    };
    this.#executions.set(id, rec);
    return id;
  }

  event(executionId, event) {
    this.#must(executionId).events.push(Object.freeze({
      ...event,
      at: event.at ?? new Date().toISOString(),
    }));
  }

  artifact(executionId, artifactRef) {
    this.#must(executionId).artifacts.push(artifactRef);
  }

  decision(executionId, decision) {
    this.#must(executionId).decisions.push(decision);
  }

  validation(executionId, report) {
    this.#must(executionId).validation.push(report);
  }

  output(executionId, output) {
    this.#must(executionId).outputs.push(output);
  }

  failure(executionId, err) {
    this.#must(executionId).failures.push({
      message: String(err?.message ?? err),
      at: new Date().toISOString(),
    });
  }

  cost(executionId, costRecord) {
    this.#must(executionId).cost = costRecord;
  }

  finish(executionId, { status = 'succeeded' } = {}) {
    const rec = this.#must(executionId);
    rec.finishedAt = new Date().toISOString();
    rec.durationMs = Date.parse(rec.finishedAt) - Date.parse(rec.startedAt);
    rec.status = status;
    return this.replay(executionId);
  }

  get(executionId) {
    const rec = this.#executions.get(executionId);
    return rec ? freezeClone(rec) : null;
  }

  /** Full replay envelope for debugging, audits, improvement. */
  replay(executionId) {
    const rec = this.get(executionId);
    if (!rec) throw new Error(`unknown execution ${executionId}`);
    return {
      execution: rec.id,
      projectId: rec.projectId,
      jobId: rec.jobId,
      agentId: rec.agentId,
      type: rec.type,
      context: rec.context,
      events: rec.events,
      artifacts: rec.artifacts,
      decisions: rec.decisions,
      validation: rec.validation,
      outputs: rec.outputs,
      failures: rec.failures,
      cost: rec.cost,
      duration: rec.durationMs,
      status: rec.status,
      startedAt: rec.startedAt,
      finishedAt: rec.finishedAt,
    };
  }

  list({ projectId, status } = {}) {
    return [...this.#executions.values()]
      .filter((e) => (!projectId || e.projectId === projectId) && (!status || e.status === status))
      .map((e) => freezeClone(e));
  }

  #must(id) {
    const rec = this.#executions.get(id);
    if (!rec) throw new Error(`unknown execution ${id}`);
    return rec;
  }
}

function structuredCloneSafe(v) {
  try {
    return structuredClone(v);
  } catch {
    return JSON.parse(JSON.stringify(v ?? {}));
  }
}

function freezeClone(rec) {
  return {
    ...rec,
    events: [...rec.events],
    artifacts: [...rec.artifacts],
    decisions: [...rec.decisions],
    validation: [...rec.validation],
    outputs: [...rec.outputs],
    failures: [...rec.failures],
    context: structuredCloneSafe(rec.context),
  };
}
