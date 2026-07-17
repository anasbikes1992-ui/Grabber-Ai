# 03 — DATABASE STANDARD

**Status:** Approved · **Version:** 1.0.0
**Binds:** Database Architect, Database worker, Data validator

## 1. Scope

Schema design, migrations, access policies, and data lifecycle for every
generated project, regardless of database engine.

## 2. Rules

**Schema**
- DB-01 Every schema MUST derive from the Data Architecture stage (lifecycle stage 7) and the Project DNA file — never improvised during development.
- DB-02 Every table MUST declare: primary key, created_at/updated_at, and ownership column(s) used by access policies.
- DB-03 Naming MUST be consistent: snake_case, singular or plural chosen once per project in the DNA file, never mixed.
- DB-04 Foreign keys MUST be enforced at the database level; application-only referential integrity is prohibited.
- DB-05 Enumerations MUST be constrained (native enums or check constraints), not free-text.

**Access & Security**
- DB-06 Every table MUST have an explicit access policy (RLS or equivalent) declared in the data architecture — including "public read" as an explicit choice (see 05-SECURITY S-03).
- DB-07 Application roles MUST hold least privilege; no runtime role may own DDL rights.

**Migrations**
- DB-08 All schema changes MUST be migrations: versioned, forward-only, reviewed, and reversible or explicitly marked irreversible with an EDR.
- DB-09 Migrations MUST be runnable from zero to current on a clean database in CI.
- DB-10 Destructive migrations (drop/alter with data loss) MUST include a data-preservation step or an EDR accepting the loss.

**Lifecycle & Performance**
- DB-11 Every project MUST declare data retention and deletion rules in the DNA file (regulated data → extended discovery per 01-OPERATING-SYSTEM §9).
- DB-12 Every query pattern in the service layer MUST be covered by an index review; N+1 access patterns fail validation.
- DB-13 Seed data for development MUST be synthetic — never production or client data.

## 3. Validation Rubric

| Check | Method | Weight |
|-------|--------|--------|
| DB-01–DB-05 schema | schema scan vs data architecture | 30% |
| DB-06–DB-07 access | policy coverage scan | 30% |
| DB-08–DB-10 migrations | CI migration run | 25% |
| DB-11–DB-13 lifecycle/perf | DNA check + query analysis | 15% |

Gate threshold: **95%**.

## 4. Exceptions

Only via an Accepted EDR.

## 5. Changelog

- 1.0.0 (2026-07-15) — initial version.
