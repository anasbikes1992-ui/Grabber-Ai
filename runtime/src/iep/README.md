# Intelligent Execution Platform (v1.7 / EDR-006)

Deterministic execution environment. **Agents are replaceable participants**
(configuration + lifecycle), not the center of the architecture.

```
Scheduler → Priority Queue → Dependency Resolver → Executor
    → Validation/Publish (agent steps) → Metrics / Cost / Recorder
```

| Module | File | Role |
|--------|------|------|
| Locks | `locks.js` | Exclusive resource holds |
| Sessions | `sessions.js` | Operator/execution sessions |
| Queue | `queue.js` | Priority + dependsOn + retry/dead |
| Scheduler | `scheduler.js` | Handlers + scheduleAgent |
| Cache | `cache.js` | Hit/miss tracked cache |
| Memory | `memory.js` | working/project/knowledge/org/personal |
| Cost | `cost.js` | estimate vs actual tokens/USD |
| Metrics | `metrics.js` | Engineering KPIs |
| Recorder | `recorder.js` | Replayable executions |
| Executor | `executor.js` | Single job run |
| Orchestrator | `orchestrator.js` | Drain queue / DAG |
| Agent Runtime | `agent-runtime.js` | Config-loaded agents |

```js
import { createIEP } from './index.js';

const iep = createIEP({ bus });
iep.agents.register(config, impl);
iep.scheduler.scheduleAgent({ agentId, projectId, payload });
await iep.orchestrator.runUntilIdle();
iep.recorder.replay(executionId);
iep.kpis({ projectId });
```
