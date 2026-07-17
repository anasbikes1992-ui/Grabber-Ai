# 17 — GIT STANDARD

**Status:** Approved · **Version:** 1.0.0
**Binds:** all agents producing versioned artifacts, Merge validator

## 1. Scope

Version control of **all first-class artifacts** — code, knowledge, prompts,
standards, templates, agent specs, workflows, architectures, documentation.
Everything is versioned (MASTER: Version Everything).

## 2. Rules

**Branching & Merging**
- GT-01 Trunk-based by default: short-lived branches per task, merged via reviewed merge candidates; long-lived feature branches require an EDR.
- GT-02 Main MUST always be deployable (DO-03); a red main is the top-priority incident.
- GT-03 No merge without: green pipeline, validator approval (workers never self-approve), and up-to-date branch.

**Commits**
- GT-04 Commits MUST follow Conventional Commits (`type(scope): subject`); scope names come from the module map (AR-09).
- GT-05 Every commit by an agent MUST carry provenance trailers: `Agent:`, `Prompt-Version:`, `Standards-Version:`, and `EDR:` when applicable (CO-10, OB-10).
- GT-06 Commits are atomic: one logical change; mixed refactor+feature commits fail review.

**Versioning of Artifacts**
- GT-07 Standards, templates, agent specs, prompts, and workflows MUST use semantic versioning in their front-matter; breaking changes bump major and trigger re-validation of dependents (Capability Registry tracks dependents).
- GT-08 Knowledge entries version through their `last_validated` and changelog sections (DC-09).
- GT-09 Released project versions MUST be tagged; tags are immutable.

**History**
- GT-10 History MUST NOT be rewritten on shared branches; secrets committed by accident trigger the security incident playbook (rotation, purge, EDR), not a quiet force-push.

## 3. Validation Rubric

| Check | Method | Weight |
|-------|--------|--------|
| GT-01–GT-03 flow | branch + pipeline audit | 30% |
| GT-04–GT-06 commits | commit lint + provenance check | 30% |
| GT-07–GT-09 artifact versioning | front-matter + tag audit | 30% |
| GT-10 history | audit | 10% |

Gate threshold: **95%**.

## 4. Exceptions

Only via an Accepted EDR.

## 5. Changelog

- 1.0.0 (2026-07-15) — initial version.
