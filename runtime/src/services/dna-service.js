// services/dna-service.js — Project DNA Service (EDR-004 Foundation API).
// Single write/read path for Project DNA documents. DNA changes after
// approval emit project.dna_changed so the Dependency Graph can mark
// stale artifacts (AR-11, DC-08).
import { sha256, validateConstraintBlock } from '../kernel/types.js';

const REQUIRED_TOP = [
  'name', 'industry', 'goals', 'constraints', 'architecture', 'stack',
  'standards_version',
];

export class DnaService {
  #store;
  #bus;
  #graph;

  /**
   * @param {{ documents: import('../storage/store.js').MemoryDocumentStore, graph?: import('../storage/store.js').MemoryGraphStore, bus?: import('../events/bus.js').EventBus }} deps
   */
  constructor({ documents, graph = null, bus = null }) {
    this.#store = documents;
    this.#graph = graph;
    this.#bus = bus;
  }

  /** Validate and register DNA. Returns versioned record. */
  put({ projectId, dna, approved = false, actor = 'dna-service' }) {
    if (!projectId) throw new ServiceError(['projectId required']);
    const body = normalizeDna(dna);
    const errors = validateDna(body);
    if (errors.length) throw new ServiceError(errors);

    const existing = this.listVersions(projectId);
    const version = nextSemver(existing);
    const checksum = sha256(body);
    const id = `${projectId}@${version}`;
    const record = {
      project_id: projectId,
      version,
      content: body,
      checksum,
      approved,
      created_at: new Date().toISOString(),
      actor,
    };
    this.#store.put('project_dna', id, record);
    this.#store.put('projects', projectId, {
      id: projectId,
      name: body.name,
      industry: body.industry,
      dna_version: version,
      standards_version: body.standards_version,
      updated_at: record.created_at,
    });

    if (this.#graph) {
      this.#graph.upsertNode({ id: `dna:${projectId}`, type: 'dna', props: { projectId, version } });
      for (const section of Object.keys(body)) {
        const sid = `dna:${projectId}:${section}`;
        this.#graph.upsertNode({ id: sid, type: 'dna_section', props: { projectId, section } });
        this.#graph.addEdge({ from: `dna:${projectId}`, to: sid, type: 'depends_on' });
      }
    }

    if (this.#bus && existing.length) {
      this.#bus.emit({
        type: 'project.dna_changed',
        project: projectId,
        stage: '',
        subject: id,
        actor,
        payload: { version, previous: existing[existing.length - 1]?.version, checksum },
      });
    }
    return record;
  }

  get(projectId, version = 'latest') {
    const versions = this.listVersions(projectId);
    if (!versions.length) return null;
    if (version === 'latest') return versions[versions.length - 1];
    return versions.find((v) => v.version === version) ?? null;
  }

  listVersions(projectId) {
    return this.#store
      .query('project_dna', (r) => r.project_id === projectId)
      .sort((a, b) => semverCmp(a.version, b.version));
  }

  /** Section read used by Context Engine / agents (typed, not free-search). */
  section(projectId, path) {
    const rec = this.get(projectId);
    if (!rec) return null;
    return path.split('.').reduce((acc, key) => (acc == null ? null : acc[key]), rec.content);
  }

  approve(projectId, version, actor = 'owner') {
    const rec = this.get(projectId, version);
    if (!rec) throw new ServiceError([`unknown DNA ${projectId}@${version}`]);
    return this.#store.put('project_dna', `${projectId}@${rec.version}`, {
      ...rec,
      approved: true,
      approved_by: actor,
      approved_at: new Date().toISOString(),
    });
  }
}

function normalizeDna(dna) {
  if (!dna || typeof dna !== 'object') return {};
  // Accept either { project: {...} } envelope or flat project body.
  return dna.project && typeof dna.project === 'object' ? { ...dna.project } : { ...dna };
}

export function validateDna(body) {
  const errors = [];
  for (const k of REQUIRED_TOP) {
    if (body[k] === undefined || body[k] === null || body[k] === '') {
      errors.push(`DNA missing required field "${k}"`);
    }
  }
  if (Array.isArray(body.goals) && body.goals.length === 0) {
    errors.push('DNA.goals must be non-empty');
  }
  errors.push(...validateConstraintBlock(body.constraints));
  if (body.architecture && typeof body.architecture === 'object' && !body.architecture.style) {
    errors.push('DNA.architecture.style required (AR-01)');
  }
  return errors;
}

function nextSemver(existing) {
  if (!existing.length) return '1.0.0';
  const last = existing[existing.length - 1].version;
  const [maj, min, pat] = last.split('.').map(Number);
  return `${maj}.${min}.${(pat || 0) + 1}`;
}

function semverCmp(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

export class ServiceError extends Error {
  constructor(errors) {
    super(Array.isArray(errors) ? errors.join('; ') : String(errors));
    this.name = 'ServiceError';
    this.errors = Array.isArray(errors) ? errors : [String(errors)];
  }
}
