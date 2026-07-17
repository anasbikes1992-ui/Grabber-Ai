# Grabber AI Studio Playbook

**Status:** Living document · **Version:** 1.0.0 · **Owner:** Anaz
The onboarding manual for humans and AI. This describes how to **build and
operate** the platform — the architecture itself lives in docs 00–07 and is
frozen (EDR-001).

## 1. Purpose

- Grabber AI Studio is a **Software Engineering Operating System (SEOS)**:
  it turns Project DNA files into validated, deployable software through a
  deterministic runtime.
- It solves the reliability problem of AI-built software: no guessing, no
  anonymous artifacts, no unvalidated progress.
- It intentionally does **not**: chase model novelty, generate code outside
  the runtime, or accept work without a DNA file and constraint block.

## 2. Core Principles

- Constitution first ([constitution/](../constitution/ENGINEERING-CONSTITUTION.md), precedence order §1).
- Standards over prompts (19 standards bind every agent; prompts reference, never restate).
- Runtime over documentation (new docs must map to a runtime component).
- Evidence over confidence (gates score; workers never self-approve).
- Small, composable services (nine runtime services, event-coupled only).

## 3. Build Philosophy

- Architecture frozen before implementation (EDR-001); changes only when
  implementation exposes a flaw — see finding F-1 in EDR-003 for the model case.
- Every implementation traces to a standard rule id.
- Every architecture-touching change gets an EDR (`/decisions`, sequential numbering).
- Every artifact is versioned and enveloped (docs/06).

## 4. Repository Structure

Current monorepo: see [MASTER.md](../MASTER.md) Repository Map.
Target split at v2.0 (EDR-003 §4): **Core** (runtime, SDK, CLI, engine) ·
**Platform** (agent runtime, skills, connectors, plugins, templates) ·
**Applications** (portal, admin, dashboard, marketplace) · **Knowledge**
(standards, docs, patterns, playbooks).
Naming: standards rules are `XX-NN`, decisions are `EDR-NNN-slug`, artifacts
are `art_<ulid>`, events `evt_<ulid>`, bundles `ctx_<ulid>`.

## 5. Development Workflow

1. Create/update the Project DNA file (templates/PROJECT-DNA-TEMPLATE.yaml). DNA changes after approval require an EDR.
2. Check applicable standards (standards/00-STANDARDS-INDEX.md).
3. Review EDRs affecting the area (`/decisions`, Dependency Graph when live).
4. Build the implementation (Building layer; approved specs only).
5. Validate (eight-step sequence; corrections are structured lists).
6. Run tests from repo root: `npm test --workspace=@grabber-ai-studio/runtime`
   (and sdk/cli workspaces). DX: `node packages/cli/bin/grabber.js doctor`.
7. Publish artifacts (registry is the only write path).
8. Update knowledge if the work produced a reusable pattern (Article III).

## 6. Runtime Lifecycle

Context creation (docs/05) → Execution (docs/04 §3) → Validation (docs/04 §6)
→ Artifact publication (docs/06) → State transition (docs/07) → Learning
(02-JARVIS §8). Run the reference traversal any time:
`node runtime/pilot/pilot.js`.

## 7. Sprint Roadmap (EDR-003)

- Sprint 1 — Runtime Core ✅
- Pilot — Task Manager DNA end-to-end ✅ → v1.4
- Sprint 2 — Platform Infrastructure ✅ (EDR-004) → v1.5
- Sprint 3 — **Platform Extension Framework** ✅ (EDR-005) → v1.6
- Sprint 4 — **Intelligent Execution Platform** ✅ (EDR-006) → v1.7
- Sprint 5 — **Product Factory** ✅ (EDR-007) → v1.8: builders, 3 templates, reference projects, CLI product flow
- Track B ongoing — more product domains (ERP, booking, inventory, …) as factory proofs
- v1.9 — Product layer (Developer Portal, Client Portal, extension marketplace after 3 products)
- v2.0 — Public Release

**Dual track:** Track A platform (slow, EDR-gated) · Track B products (fast).

**Wall KPI:** time DNA → validated deployable app. Also: intervention rate, cost,
validation pass, regenerate equivalence, replay success — not file counts.

**DX:**
```bash
grabber create marketplace
grabber plan marketplace
grabber build marketplace
grabber validate marketplace
grabber deploy marketplace
```

## 8. Quality Gates

Tests required on every merge (TS-09). Gate thresholds per stage: 01-OS §3
(deployment is 100%, no partial credit). Policy checks run on every event;
POL-001 blocks deployment on security < 95. Deployment additionally requires
monitoring live and rollback rehearsed (SM-05).

## 9. Governance

Architecture may change **only** when implementation exposes a flaw, via EDR
with owner sign-off (EDR-001). Versioning: semver on all first-class
artifacts (GT-07); major bumps re-validate dependents via the Capability
Registry. Review responsibilities: Claude (Chief Software Architect) reviews
architecture, EDRs, and standards compliance; Antigravity (Lead Platform
Engineer) implements; Codex (Senior Software Engineer) generates and
refactors code. Every artifact declares inputs, outputs, dependencies,
validation criteria, related standards, and version.

## 10. Definition of Done

Code implemented · tests passing · standards satisfied (rubric scores at
threshold) · documentation updated in the same change (DC-07) · artifacts
published through the registry · knowledge updated when reusable.
A project is Done only when the platform-wide question answers YES:

> Can a brand-new Project DNA file travel through the runtime, produce
> validated artifacts, satisfy all policies, and result in a deployable
> application with minimal manual intervention?
