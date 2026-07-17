# 12 — TESTING STANDARD

**Status:** Approved · **Version:** 1.0.0
**Binds:** all Building-layer agents, QA validator

## 1. Scope

Verification of every generated artifact: unit, integration, end-to-end,
and acceptance testing.

## 2. Rules

**Coverage & Structure**
- TS-01 Every project MUST declare its test pyramid in the DNA file; defaults: unit for domain logic, integration for API + DB, E2E for critical flows.
- TS-02 Domain/service-layer code MUST reach the declared coverage floor (default 80% lines / 90% of acceptance criteria); coverage of trivial glue is not chased.
- TS-03 Every acceptance criterion from the Requirements stage MUST map to at least one automated test; unmapped criteria block the Testing gate.
- TS-04 Every critical flow declared in the DNA file MUST have an E2E test that runs in CI.

**Quality of Tests**
- TS-05 Tests MUST be deterministic; flaky tests are quarantined and fixed within the declared window — never deleted to go green.
- TS-06 Tests MUST use synthetic fixtures (DB-13); no network calls to real third parties — adapters are faked at the boundary (AR-04).
- TS-07 A bug fix MUST include a regression test reproducing the bug first.
- TS-08 Generated tests MUST assert behavior, not implementation details; snapshot tests are limited to declared stable surfaces.

**Pipeline**
- TS-09 The full suite MUST run on every merge candidate; merges with failing or skipped-without-EDR tests are prohibited.
- TS-10 Validators MUST run tests themselves (02-JARVIS-CORE §6); a worker's claim that tests pass is not evidence.

## 3. Validation Rubric

| Check | Method | Weight |
|-------|--------|--------|
| TS-01–TS-04 coverage/mapping | coverage report + criteria matrix | 40% |
| TS-05–TS-08 test quality | flake detection + review rubric | 30% |
| TS-09–TS-10 pipeline | CI logs | 30% |

Gate threshold: **95%**.

## 4. Exceptions

Only via an Accepted EDR.

## 5. Changelog

- 1.0.0 (2026-07-15) — initial version.
