# Getting Started — Setup & Usage Guide

**Audience:** you, new contributors, and AI agents operating the platform.
Architecture reference: docs 00–07 (frozen). Operating manual: PLAYBOOK.md.

---

## 1. What you have

Grabber AI Studio is a **Software Engineering Operating System (SEOS)**
running a **dual-track model** (EDR-007):

- **Track A — Platform** (slow, frozen): runtime, SDK, CLI, IEP, validation,
  policies. Changes only via implementation-exposed flaw + EDR.
- **Track B — Product** (fast, daily work): Project DNAs → Product Factory →
  validated blueprints → deployable apps. This is where you live.

## 2. Prerequisites

- Node.js ≥ 20 (`node --version`)
- Git (install and initialize — see REVIEW-v1.8-AUDIT.md P0)

## 3. One-time setup

```bash
cd grabber-ai-studio
npm install            # links the workspaces (@grabber/*)
npm test               # expect: runtime 45, sdk 3, cli 8 — all passing
node packages/cli/bin/grabber.js doctor   # expect: "ok": true
```

**If tests fail with `Cannot find package '@grabber/common'`** — the
workspace links are broken (this happens after copying/moving the folder).
Re-run `npm install` at the repo root.

Optional, to use `grabber` directly instead of the full path:

```bash
npm link ./packages/cli     # then: grabber doctor
```

## 4. Daily usage — building a product (Track B)

### Step 1 — Create the Project DNA
Everything derives from the DNA. Never start with code.

```bash
# from a template:
grabber create crm
# or copy a reference and edit it:
cp reference-projects/crm/project-dna.json projects/my-client/project-dna.json
```

Fill in: goals, users, constraints (must / must_not / unknowns!), stack,
security_level, critical_flows. Unknowns are listed, never guessed —
the runtime enforces this.

### Step 2 — Plan, build, validate, deploy

```bash
grabber plan  projects/my-client/project-dna.json   # shows the factory pipeline
grabber build projects/my-client/project-dna.json   # DNA → complete blueprint
grabber validate my-client                          # gates + policies
grabber deploy my-client                            # deploy readiness check
```

Every build reports: fingerprint, builders run, interventions, cost, files.
**The number you watch is interventions — the Wall KPI is time from DNA to
validated deployable app with interventions ≈ 0.**

### Step 3 — Run the generated app

```bash
npm run saas:dev          # dev server for the SaaS starter
npm run saas:build        # production build
npm run saas:test:modules # module test suites
```

### Step 4 — Close the loop (mandatory)
A project isn't done until learning is merged (SM-06): record what was
reused, what needed intervention, and promote anything used twice into
`knowledge/patterns/` or a module in the catalog.

## 5. Extending the platform (still Track B)

```bash
grabber skill list                 # 21 first-party skills
grabber skill install <id>         # frameworks, languages, integrations, infra
grabber plugin install <path>      # extensions via the plugin SDK
grabber template create <name>     # scaffold a new product template
grabber graph impact <project>     # blast radius of a DNA change
```

Grow these catalogs — modules, blueprints, skills, golden references — not
the core.

## 6. Rules of use (how it SHOULD be used)

1. **DNA-first, always.** No artifact exists without `derives_from` DNA.
2. **Never hand-edit generated artifacts.** Change the DNA or the builder,
   regenerate. Hand-patches create drift the registry can't track.
3. **Never bypass a gate.** A failing validation returns a correction list —
   fix and re-run. Two failures escalate to you by design.
4. **Every architecture-touching change gets an EDR** in `/decisions`
   (next: EDR-008). No exceptions — this is what keeps the system coherent.
5. **Reuse before build.** Check `skills/catalog.json`, blueprints, and
   `knowledge/patterns/` before writing anything new (an agent solving a
   pattern-covered problem without the pattern fails validation).
6. **Verify, weekly:** `npm test && grabber doctor` plus one reference build
   (`grabber build reference-projects/crm/project-dna.json`) — that's your
   factory regression check.

## 7. Reading order for new contributors (human or AI)

1. `MASTER.md` — what this is, current status
2. `docs/PLAYBOOK.md` — how to operate it
3. `constitution/ENGINEERING-CONSTITUTION.md` — the immutable rules
4. `standards/00-STANDARDS-INDEX.md` — the 19 standards (skim, reference later)
5. `docs/04–07` — runtime contracts (read before touching runtime code)
6. `docs/JOURNEY.md` — why everything is the way it is

## 8. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Cannot find package '@grabber/common'` | broken workspace links after copy/move | `npm install` at repo root |
| Tests pass but root `npm test` hides a failure | `;` separators in the script | change to `&&` (see audit P1) |
| `grabber status` → unknown command | it's namespaced | `grabber runtime status` |
| Folder huge to back up | `node_modules` 450 MB + `.next` | exclude both; never zip them |
| A doc contradicts another | precedence order | Constitution > Standards > EDRs > everything else |
