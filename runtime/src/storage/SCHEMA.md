# Storage Schema — Platform Infrastructure (EDR-004)

This document is the **explicit persistence design** for Sprint 2 / v1.5.
Runtime services depend on storage *contracts* (`store.js`), not drivers.
Adapters implement these tables/collections against PostgreSQL, Redis, and a
vector database without changing business logic.

## Principles

1. One source of truth per entity (Rule 1).
2. Business logic never imports `pg`, `ioredis`, or a vector SDK.
3. Events remain append-only; relational tables are projections.
4. Vector providers are swappable (`MemoryVectorIndex` → OpenAI / pgvector / etc.).

---

## PostgreSQL (relational)

### `organizations`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | `org_<ulid>` |
| name | text | |
| created_at | timestamptz | |

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | `usr_<ulid>` |
| org_id | text FK | |
| email | text unique | |
| role | text | platform role |

### `projects`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| org_id | text FK nullable | |
| name | text | |
| stage | text | state machine projection |
| condition | text | active / escalated / closed |
| dna_version | text | |
| standards_version | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `project_dna`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| project_id | text FK | |
| version | text | semver |
| content | jsonb | full DNA document |
| checksum | text | sha256 |
| approved | boolean | |
| created_at | timestamptz | |

### `artifacts`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | `art_<ulid>` |
| project_id | text FK | |
| type | text | envelope type |
| stage | text | |
| state | text | lifecycle |
| version | text | |
| producer | jsonb | |
| inputs | jsonb | artifact ids |
| related_standards | jsonb | rule ids |
| derives_from | jsonb | DNA paths |
| content | jsonb | |
| checksum | text | |
| validation | jsonb | |
| superseded_by | text nullable | |
| created_at | timestamptz | |

Indexes: `(project_id, type)`, `(project_id, state)`, `(type, state)`.

### `events`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | `evt_<ulid>` |
| type | text | catalogue |
| project_id | text | |
| stage | text | |
| subject | text | |
| actor | text | |
| payload | jsonb | |
| causation_id | text | |
| correlation_id | text | |
| occurred_at | timestamptz | |

Index: `(project_id, occurred_at)`, `(type, occurred_at)`.

### `decisions` (EDRs)
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | `EDR-NNN` |
| status | text | |
| owner | text | |
| project | text | platform or client |
| stage | text | |
| title | text | |
| body | text | markdown |
| related_standards | jsonb | |
| related_components | jsonb | |
| created_at | timestamptz | |

### `rules`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | e.g. `AR-01`, `DC-05` |
| standard | text | file / number |
| prefix | text | AR, CO, DB… |
| statement | text | |
| level | text | MUST/SHOULD/MAY |
| version | text | standards set version |

### `capabilities`
| Column | Type | Notes |
|--------|------|-------|
| name | text PK | |
| status | text | |
| owner | text | |
| version | text | |
| depends_on | jsonb | |
| validated_by | text | |
| metrics | jsonb | |

### `patterns`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | `pattern/<domain>/<slug>` |
| industry | jsonb | |
| status | text | |
| version | text | |
| problem | text | |
| solution | text | |
| standards | jsonb | |
| source_project | text | |
| last_validated | date | |

### `knowledge_entries`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| type | text | pattern, playbook, mistake… |
| industry | text | |
| pattern | text | |
| status | text | |
| source_project | text | |
| last_validated | date | |
| path | text | repo-relative home |
| body | text | |
| tags | jsonb | |

### `policies`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | e.g. POL-001 |
| trigger | text | |
| action | text | block / warn |
| body | jsonb | |

### `project_state_history`
| Column | Type | Notes |
|--------|------|-------|
| id | bigserial PK | |
| project_id | text | |
| from_stage | text | |
| to_stage | text | |
| reason | text | |
| occurred_at | timestamptz | |

---

## Redis (ephemeral)

| Key pattern | Purpose |
|-------------|---------|
| `session:{id}` | operator / agent sessions |
| `lock:project:{id}` | exclusive stage runners |
| `queue:tasks` | work queue (list/stream) |
| `schedule:{job}` | delayed jobs |
| `health:snapshot` | latest System Health |

TTL required on sessions and locks. Never store DNA or artifacts only in Redis.

---

## Vector database

Collections (logical; map to namespaces/tables per provider):

| Collection | Embeds | Filters |
|------------|--------|---------|
| knowledge | entry body + title | type, industry, status |
| patterns | problem + solution | industry, status |
| documentation | standards / docs sections | standard id |
| decisions | EDR body | status, project |

Query contract (service layer):

```
{ collection, query, limit, filter? } → [{ id, score, meta }]
```

Provider interface: `upsert`, `delete`, `search` — see `MemoryVectorIndex`.

---

## Graph projection

The Dependency Graph may be:

- **Primary** in a graph store / edge tables, or
- **Derived** from artifact envelopes (`derives_from`, `inputs`, `related_standards`)
  plus DNA/decision/capability edges.

Edge types (docs/04 §7): `derives_from`, `depends_on`, `validates_against`,
`affected_by`, `supersedes`.

---

## Adapter roadmap

| Provider | When |
|----------|------|
| Memory* (default) | tests, pilot, local |
| PostgreSQL | multi-project durability |
| Redis | concurrent workers, CLI sessions |
| pgvector / external vector | semantic search at scale |

Each adapter implements the same methods used by Foundation APIs today.
