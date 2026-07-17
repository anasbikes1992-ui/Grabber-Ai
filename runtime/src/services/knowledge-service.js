// services/knowledge-service.js — Knowledge Service (EDR-004 Foundation API).
// Implements docs/03 retrieval contract: typed intent, never free-search repo.

const INTENTS = new Set([
  'pattern-lookup',
  'standard',
  'playbook',
  'prior-decision',
  'mistake-check',
  'component',
  'general',
]);

export class KnowledgeService {
  #store;
  #graph;
  #vectors;
  #patterns;
  #decisions;
  #rules;

  /**
   * @param {object} deps
   * @param {import('./pattern-service.js').PatternService} [deps.patterns]
   * @param {import('./decision-service.js').DecisionService} [deps.decisions]
   * @param {import('./rule-service.js').RuleService} [deps.rules]
   */
  constructor({ documents, graph = null, vectors = null, patterns = null, decisions = null, rules = null }) {
    this.#store = documents;
    this.#graph = graph;
    this.#vectors = vectors;
    this.#patterns = patterns;
    this.#decisions = decisions;
    this.#rules = rules;
  }

  put(entry) {
    if (!entry?.id) throw new Error('knowledge.id required');
    const row = {
      id: entry.id,
      type: entry.type ?? 'general',
      industry: entry.industry ?? '',
      pattern: entry.pattern ?? '',
      status: entry.status ?? 'active',
      source_project: entry.source_project ?? '',
      last_validated: entry.last_validated ?? null,
      path: entry.path ?? '',
      body: entry.body ?? '',
      tags: entry.tags ?? [],
      related_standards: entry.related_standards ?? [],
    };
    this.#store.put('knowledge', row.id, row);

    if (this.#graph) {
      this.#graph.upsertNode({ id: `knowledge:${row.id}`, type: 'knowledge', props: { id: row.id, type: row.type } });
      for (const std of row.related_standards) {
        this.#graph.upsertNode({ id: `rule:${std}`, type: 'rule', props: { id: std } });
        this.#graph.addEdge({ from: `knowledge:${row.id}`, to: `rule:${std}`, type: 'validates_against' });
      }
    }
    if (this.#vectors) {
      this.#vectors.upsert({
        id: `knowledge:${row.id}`,
        text: `${row.id}\n${row.body}\n${(row.tags ?? []).join(' ')}`,
        meta: { collection: 'knowledge', id: row.id, type: row.type, industry: row.industry },
      });
    }
    return row;
  }

  get(id) {
    return this.#store.get('knowledge', id);
  }

  /**
   * Typed retrieval (docs/03 §3).
   * @param {{ intent: string, industry?: string, pattern?: string, feature?: string, stage?: string, q?: string, limit?: number }} req
   */
  retrieve(req = {}) {
    const intent = req.intent ?? 'general';
    if (!INTENTS.has(intent)) {
      throw new Error(`unknown knowledge intent "${intent}" — use ${[...INTENTS].join('|')}`);
    }

    let entries = [];
    let bindingStandards = [];

    switch (intent) {
      case 'pattern-lookup': {
        const patterns = this.#patterns
          ? this.#patterns.query({ industry: req.industry, q: req.pattern || req.feature || req.q })
          : [];
        entries = patterns.map((p) => ({ kind: 'pattern', id: p.id, summary: p.problem, record: p }));
        bindingStandards = [...new Set(patterns.flatMap((p) => p.standards ?? []))];
        break;
      }
      case 'prior-decision': {
        const eds = this.#decisions
          ? this.#decisions.query({ q: req.q || req.feature, project: req.project })
          : [];
        entries = eds.map((d) => ({ kind: 'decision', id: d.id, summary: d.title, record: d }));
        bindingStandards = [...new Set(eds.flatMap((d) => d.related_standards ?? []))];
        break;
      }
      case 'standard': {
        const rules = this.#rules
          ? this.#rules.query({ prefix: req.prefix, q: req.q, standard: req.standard })
          : [];
        entries = rules.map((r) => ({ kind: 'rule', id: r.id, summary: r.statement, record: r }));
        bindingStandards = rules.map((r) => r.id);
        break;
      }
      case 'mistake-check':
      case 'playbook':
      case 'component':
      case 'general':
      default: {
        entries = this.#store
          .query('knowledge', (k) => {
            if (intent !== 'general' && intent !== 'mistake-check' && k.type !== intentToType(intent)) return false;
            if (intent === 'mistake-check' && k.type !== 'mistake' && k.type !== 'solution') return false;
            if (req.industry && k.industry && k.industry !== req.industry) return false;
            if (req.pattern && k.pattern && k.pattern !== req.pattern) return false;
            if (req.q) {
              const hay = `${k.id} ${k.body} ${(k.tags ?? []).join(' ')}`.toLowerCase();
              if (!hay.includes(String(req.q).toLowerCase())) return false;
            }
            return true;
          })
          .map((k) => ({ kind: 'knowledge', id: k.id, summary: k.body.slice(0, 160), record: k }));
        bindingStandards = [...new Set(entries.flatMap((e) => e.record.related_standards ?? []))];
      }
    }

    // Optional semantic ranking when vectors available and q present.
    if (this.#vectors && req.q) {
      const hits = this.#vectors.search(req.q, {
        limit: req.limit ?? 10,
        filter: (meta) => meta.collection === 'knowledge' || meta.collection === 'patterns' || meta.collection === 'decisions',
      });
      const scoreById = new Map(hits.map((h) => [h.meta.id || h.id.replace(/^(knowledge|pattern|edr):/, ''), h.score]));
      entries = entries
        .map((e) => ({ ...e, score: scoreById.get(e.id) ?? 0 }))
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    }

    const limit = req.limit ?? 20;
    return {
      intent,
      entries: entries.slice(0, limit),
      binding_standards: this.#rules ? this.#rules.applicable(bindingStandards) : bindingStandards.map((id) => ({ id })),
    };
  }
}

function intentToType(intent) {
  if (intent === 'playbook') return 'playbook';
  if (intent === 'component') return 'component';
  return intent;
}
