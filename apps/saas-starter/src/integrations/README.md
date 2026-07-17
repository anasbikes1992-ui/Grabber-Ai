# Integration Layer (Sprint 4)

**Not raw connectors.** DNA decides which systems apply; each provider executes
a thin plan (create repo, migrate, prices, deploy).

```
Project DNA
    ↓
Integration Planner
    ↓
GitHub · Supabase · Stripe · Vercel
    ↓
Production URL (planned / dry-run without secrets)
```

Live execution requires env secrets (`GITHUB_TOKEN`, `SUPABASE_ACCESS_TOKEN`,
`STRIPE_SECRET_KEY`, `VERCEL_TOKEN`). Default mode is **dry-run**.

Business logic stays out of providers — only auth, transport, and resource
bootstrap steps.
