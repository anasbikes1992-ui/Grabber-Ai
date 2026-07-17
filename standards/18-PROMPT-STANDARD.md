# 18 — PROMPT STANDARD

**Status:** Approved · **Version:** 1.0.0
**Binds:** Prompt OS (Phase 4), all agents, Prompt validator

This standard is the constitution the Prompt OS will be built on. Prompts
never invent their own rules.

## 1. Scope

Every prompt asset in `knowledge/prompts/` and every task prompt assembled at
runtime by Jarvis for any agent or model.

## 2. Rules

**Grounding (AI never guesses — MASTER Rule 4)**
- PR-01 Every task prompt MUST be assembled from: agent spec + bound standards + knowledge query results + relevant EDRs + project context (DNA file). Free-form prompting of workers is prohibited.
- PR-02 A prompt MUST NOT restate standards content; it references standard ids (Rule 1: one source of truth). The assembler injects the current version.
- PR-03 If a required standard, pattern, or decision is missing, the prompt MUST instruct escalation — never "use your best judgment" on decision-bearing gaps.

**Constraint Block (the Constraint Engine)**
- PR-04 Every task prompt MUST contain an explicit constraint block: `Must / Should / May / Must Not / Assumptions / Unknowns / Risks` (templates/CONSTRAINT-BLOCK-TEMPLATE.md). Tasks without a constraint block fail validation before execution.
- PR-05 Unknowns MUST be listed, not resolved by invention; an agent that fills an Unknown escalates or records an assumption in its output for validator review.

**Structure**
- PR-06 Every prompt asset MUST declare: id, semantic version, owner, target role (router class, 02-JARVIS-CORE §3), input schema, output schema, and examples.
- PR-07 Output MUST be requested against a declared schema; free-text output from Building-layer agents fails validation.
- PR-08 Prompts MUST be model-agnostic in content; model-specific adjustments live in router adapters, not in the prompt body (Rule 2).

**Lifecycle**
- PR-09 Prompt changes follow GT-07 semantic versioning; effectiveness metrics (success rate, correction rate — 01-OPERATING-SYSTEM §6) are recorded per version by the Learning Engine.
- PR-10 A prompt version that underperforms its predecessor on the same task class MUST be rolled back; prompt regressions are treated like code regressions.

## 3. Validation Rubric

| Check | Method | Weight |
|-------|--------|--------|
| PR-01–PR-03 grounding | assembler audit + reference scan | 35% |
| PR-04–PR-05 constraints | constraint-block presence + escalation test | 25% |
| PR-06–PR-08 structure | front-matter + schema lint | 25% |
| PR-09–PR-10 lifecycle | version metrics audit | 15% |

Gate threshold: **95%**.

## 4. Exceptions

Only via an Accepted EDR.

## 5. Changelog

- 1.0.0 (2026-07-15) — initial version.
