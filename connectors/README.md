# Priority connectors (EDR-007)

Thin only: auth, transport, subscribe, transfer, webhooks. No business logic.

| Connector | Unlocks |
|-----------|---------|
| GitHub | repos, PRs, CI |
| Supabase | auth, db, storage |
| Stripe | payments |
| PostgreSQL | direct SQL (skill + later adapter) |
| Docker | local/prod containers |
| Vercel | (stub next) frontend deploy |

Live network I/O waits on secrets + connector runtime hosts; manifests define the contract now.
