# 02 — CODING STANDARD

**Status:** Approved · **Version:** 1.0.0
**Binds:** all Building-layer agents, Code validator

## 1. Scope

All application code produced by any agent or model, in any language. Language-
specific style is delegated to linters; this standard governs what linters
can't: structure, clarity, and AI-generation discipline.

## 2. Rules

**Structure**
- CO-01 Functions MUST do one thing; exceeding ~40 lines or 3 nesting levels requires refactoring before merge.
- CO-02 Every module MUST expose a minimal public surface; internal helpers are not exported.
- CO-03 Duplicate logic appearing a second time MUST be extracted; appearing in a second project, it MUST be proposed to the Pattern Library.
- CO-04 Dead code, commented-out code, and unused dependencies MUST NOT be merged.

**Clarity**
- CO-05 Names MUST follow 10-NAMING conventions embedded here: intention-revealing, no abbreviations except an approved list, consistent casing per language.
- CO-06 Non-obvious decisions in code MUST reference their EDR id in a comment; comments explain *why*, never *what*.
- CO-07 Magic numbers/strings MUST be named constants.

**AI-Generation Discipline**
- CO-08 Generated code MUST compile/lint clean on first validation; two consecutive failures escalate (02-JARVIS-CORE §6).
- CO-09 Agents MUST NOT invent APIs: every external API usage is checked against the dependency's documented surface or the Pattern Library.
- CO-10 Generated code MUST carry provenance metadata (agent, prompt version, standards version) in the commit, not in source files.
- CO-11 TODOs are prohibited in merged code; unfinished work becomes a tracked task.

**Safety**
- CO-12 All errors MUST be handled per 16-ERROR-HANDLING; silent catch blocks are prohibited.
- CO-13 Concurrency primitives MUST follow a pattern from the Pattern Library or carry an EDR.

## 3. Validation Rubric

| Check | Method | Weight |
|-------|--------|--------|
| Lint + type check + build | automated | 30% |
| CO-01–CO-04 structure | static analysis | 25% |
| CO-05–CO-07 clarity | reviewer agent rubric | 20% |
| CO-08–CO-11 AI discipline | pipeline metadata + API check | 15% |
| CO-12–CO-13 safety | static analysis | 10% |

Gate threshold: **90%**.

## 4. Exceptions

Only via an Accepted EDR.

## 5. Changelog

- 1.0.0 (2026-07-15) — initial version.
