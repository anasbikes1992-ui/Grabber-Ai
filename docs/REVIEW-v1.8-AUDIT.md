# Architecture & Implementation Audit — v1.8.0

**Reviewer:** Claude (Chief Software Architect) · **Date:** 2026-07-15
**Scope:** full repository as completed in this folder (932 files, monorepo)

---

## Verdict

**The platform is real and operational.** With workspace links intact, the
full suite passes — **56/56 tests** (runtime 45, SDK 3, CLI 8). `grabber
doctor` reports healthy (7 capabilities, 21 first-party skills, 3 product
templates), and `grabber build` on the CRM reference DNA produced a 21-file
blueprint through 11 deterministic builders in 8 ms with 0 interventions and
a product fingerprint. The freeze discipline held: every expansion since v1.4
(EDR-004 infrastructure, EDR-005 extensions, EDR-006 IEP, EDR-007 Product
Factory) is recorded in the Decision Registry. This is the dual-track
operating model working as designed.

## What's strong

1. Governance survived growth — EDRs 004–007 exist, MASTER reflects the
   dual-track model, and the Wall KPI replaced file-count vanity metrics.
2. The success metric still answers YES, now through the CLI, not just the pilot.
3. Extension surfaces (skills catalog, connectors, plugin/template/workflow
   SDKs) follow Rule 2 — new capability without touching the core.
4. Reference projects (saas, crm, marketplace) give you a regression suite
   for the factory itself — golden references are the right control.

## Findings & improvements (prioritized)

### P0 — Not a git repository
The folder has `.gitignore` but **no `.git`**. This violates the entire
17-GIT standard: no provenance trailers (GT-05), no artifact versioning
(GT-07), no tags, no rollback. One bad edit can destroy unrecoverable work.
**Fix:** `git init && git add -A && git commit -m "chore: import v1.8.0 platform"`,
then tag `v1.8.0`. Consider a private GitHub remote for off-machine backup.

### P1 — Workspace links are fragile
`node_modules/@grabber/*` are npm workspace symlinks. They break whenever the
folder is copied, zipped, or moved — the symptom is
`ERR_MODULE_NOT_FOUND: Cannot find package '@grabber/common'` in the
extensions/IEP/SDK/CLI tests. **Fix:** after any move/clone, re-run
`npm install` at the repo root. Add this to GETTING-STARTED (done) and to a
`grabber doctor` check if not already detected.

### P1 — Root test script swallows failures
`"test": "... ; ... ; ..."` uses `;` — if the runtime suite fails, the
command still exits 0. That violates the spirit of TS-09 (no green without
green). **Fix:** replace `;` with `&&` in `package.json` scripts.test.

### P2 — No CI
All gates are currently run by hand. **Fix:** add a GitHub Actions workflow
that runs `npm install`, `npm test`, `grabber doctor`, and a
reference-project build on every push. That makes the Validation Runtime's
"no merge without green" (GT-03) mechanical.

### P2 — Build artifacts inside the working tree
`apps/saas-starter/node_modules` (450 MB) and `.next` (11 MB) live in the
folder. `.gitignore` covers them, but they bloat backups and the old zips in
`D:\Jarvis 2` (including one 0-byte corrupt zip: `grabber-ai-studio-v1.0-foundation.zip`).
**Fix:** delete the stale zips or move good ones to a `releases/` folder;
never zip the folder without excluding `node_modules` and `.next`.

### P3 — Capability Registry consistency pass
The registry has 28 entries; v1.8 added IEP, Product Factory, extension SDKs.
Do one pass verifying every EDR-004..007 component has a registry entry with
correct status/owner/metrics (Jarvis "knows what it can do" only if this is
current).

### P3 — Minor CLI UX
`grabber status` errors (correct command is `grabber runtime status`).
Consider an alias, since it's the most natural first thing to type.

## Standing rule going forward

Architecture remains frozen. Growth belongs in Track B: modules, blueprints,
skills, templates, golden references. Track A changes only with an
implementation-exposed flaw + EDR. Measure the Wall KPI, not file counts.
