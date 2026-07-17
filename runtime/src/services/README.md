# Foundation APIs — Platform Infrastructure (v1.5 / EDR-004)

Internal platform services. Every future agent, skill, connector, and the
future `@grabber/sdk` consume **these** APIs — never raw filesystem paths or
private runtime modules.

| Service | Module | Answers |
|---------|--------|---------|
| Project DNA | `dna-service.js` | Validate/version DNA; section reads; `project.dna_changed` |
| Rule | `rule-service.js` | Standards rules by id/prefix/standard |
| Decision | `decision-service.js` | EDRs; which decision introduced a rule |
| Capability | `capability-service.js` | Registry as API; reverse dependents |
| Pattern | `pattern-service.js` | Pattern library; capability usage |
| Knowledge | `knowledge-service.js` | Typed retrieval (docs/03 §3) + binding standards |
| Artifact Query | `artifact-query-service.js` | Dependents, DNA section, provenance, filters |
| Dependency Graph | `dependency-graph-service.js` | DG-01 order, DG-02 impact, DG-03 provenance |

## Usage

```js
import { EventBus } from '../events/bus.js';
import { ArtifactRegistry } from '../artifacts/registry.js';
import { createPlatformServices } from './index.js';

const bus = new EventBus();
const registry = new ArtifactRegistry(bus, { stageOf, layerOf });
const platform = createPlatformServices({ bus, registry });

platform.dna.put({ projectId, dna });
platform.knowledge.retrieve({ intent: 'pattern-lookup', industry: 'retail' });
platform.dependencyGraph.impact({ projectId, seeds: [`dna:${projectId}`] });
platform.search.ask('what breaks if I change this?', { projectId, seeds });
```

## Storage

See [`../storage/SCHEMA.md`](../storage/SCHEMA.md). Default providers are
in-memory; PostgreSQL / Redis / vector adapters implement the same contracts
in `../storage/store.js` without changing these services.
