# 13 — DOCUMENTATION STANDARD

**Status:** Approved · **Version:** 1.0.0
**Binds:** Documentation worker, all agents producing artifacts, Documentation validator

## 1. Scope

All documentation: project deliverables (README, API, architecture, guides)
and platform documents (standards, specs, knowledge entries).

## 2. Rules

**Project Documentation**
- DC-01 Every delivered project MUST include: README (setup + run), architecture doc (AR-09), API reference generated from the contract (AP-01), deployment runbook, and user/admin guides when the DNA file declares end-user delivery.
- DC-02 API documentation MUST be generated from the machine-readable contract — hand-written API docs are prohibited (they drift).
- DC-03 Every runbook MUST contain exact commands, rollback steps, and escalation contacts — prose descriptions of commands fail review.

**Platform Documentation**
- DC-04 Every document MUST have exactly one home and link rather than repeat (MASTER Rule 1); duplicated normative text fails review.
- DC-05 Every document MUST carry: status, version, owner, and parent link; documents follow their template (`/templates`) — structural deviations fail review.
- DC-06 Documents MUST state rules as testable MUST/SHOULD/MAY where normative; untestable normative statements move to playbooks.

**Freshness**
- DC-07 Documentation MUST be updated in the same change that alters the behavior it describes — never a follow-up task.
- DC-08 Docs referencing artifacts regenerated from the Project DNA file (AR-11) MUST themselves regenerate, not be hand-patched.
- DC-09 Knowledge entries MUST carry `last_validated` frontmatter (03-KNOWLEDGE-ENGINE §1); stale entries are flagged.

## 3. Validation Rubric

| Check | Method | Weight |
|-------|--------|--------|
| DC-01–DC-03 project docs | artifact presence + runbook lint | 40% |
| DC-04–DC-06 platform docs | template conformance + dup scan | 35% |
| DC-07–DC-09 freshness | change-coupling check | 25% |

Gate threshold: **90%**.

## 4. Exceptions

Only via an Accepted EDR.

## 5. Changelog

- 1.0.0 (2026-07-15) — initial version.
