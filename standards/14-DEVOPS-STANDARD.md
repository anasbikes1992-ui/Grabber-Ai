# 14 — DEVOPS STANDARD

**Status:** Approved · **Version:** 1.0.0
**Binds:** DevOps/Infrastructure worker, Deployment validator

## 1. Scope

Build, delivery, environments, and operations of every generated project.

## 2. Rules

**Pipeline**
- DO-01 Every project MUST have CI/CD from day one: lint → build → test → security suite (05) → gates → deploy. No manual deploys to shared environments.
- DO-02 Builds MUST be reproducible: pinned dependencies, lockfiles committed, containerized where the DNA file declares containers.
- DO-03 Every merge to main MUST produce a deployable artifact; artifacts are immutable and promoted, never rebuilt per environment.

**Environments & Configuration**
- DO-04 Minimum environments: development, staging (production-like), production. Staging MUST run migrations and the E2E suite before production promotion.
- DO-05 Configuration MUST be environment-injected against the checked-in schema (AR-05); secrets come from a secret manager (S-09), never CI variables in plain sight.
- DO-06 Infrastructure MUST be declared as code for projects whose DNA marks managed infrastructure; console-clicked resources fail review.

**Release & Rollback**
- DO-07 Every deployment MUST have a rehearsed rollback path (AR-13); rollback MUST be executable by one command/action documented in the runbook (DC-03).
- DO-08 Database migrations MUST be deployed decoupled from code when destructive (DB-10), following expand–migrate–contract.
- DO-09 Deployment gate is **100%** (01-OPERATING-SYSTEM §3): checklist complete, rollback verified, monitoring live (15-OBSERVABILITY) before traffic.

**Operations**
- DO-10 Uptime targets, backup schedule, and restore testing cadence MUST be declared in the DNA file (`deployment_targets`); a backup that has never been restored is treated as no backup.

## 3. Validation Rubric

| Check | Method | Weight |
|-------|--------|--------|
| DO-01–DO-03 pipeline | CI config + artifact audit | 30% |
| DO-04–DO-06 environments | environment + IaC inspection | 25% |
| DO-07–DO-09 release | rollback rehearsal record + checklist | 30% |
| DO-10 operations | DNA + restore-test record | 15% |

Gate threshold: **100%** at Deployment (no partial credit at this gate).

## 4. Exceptions

Only via an Accepted EDR; exceptions at the Deployment gate additionally
require owner sign-off.

## 5. Changelog

- 1.0.0 (2026-07-15) — initial version.
