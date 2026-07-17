# Jarvis OS — Phase 3

**Flagship experience layer** for Grabber AI Studio.

```
Grabber Core (engine, FROZEN)
        ↑
Product Factory (manufacturing · apps/saas-starter)
        ↑
Jarvis OS (this app · intelligence + UX)
```

## What this is

- Premium command center for the software factory
- Dark graphite · glass · cyan/violet · motion
- Layout: Command bar · Sidebar · Workspace · AI Hub · Timeline
- Consumes Product Factory HTTP APIs only

## What this is not

- A second orchestrator or runtime
- A redesign of Grabber Core
- Business logic that belongs in modules/blueprints

## Run

```bash
# Terminal 1 — factory host
cd apps/saas-starter && npm run dev

# Terminal 2 — Jarvis OS
cd apps/jarvis-os
cp .env.example .env.local
npm run dev -- -p 3001
```

Open http://localhost:3001

Without the factory host, Jarvis shows **demo metrics** and labels offline mode.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind 4 · Framer Motion · React Flow · Lucide

## Phase 3 delivered

- Design tokens + glass system
- Full shell navigation
- Dashboard (wall KPI widgets)
- Factory / DNA / Modules / Blueprints / Builders / Integrations / Deployments / Analytics
- Social + Automation scaffolds
- Factory API client with live + offline fallback

## Next (later phases)

- R3F 3D factory globe
- Live command palette (⌘K)
- Social content pipeline
- Deeper DNA editor linked to intake API
