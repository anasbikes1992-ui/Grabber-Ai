# Grabber website (Launch Phase 1)

Public acquisition surface: landing, industries, how-it-works, portfolio, pricing, FAQ, and **AI consultation** entry.

**Port:** 3003  
**Does not** host Core or Product Factory. Consulting API lives on `apps/enterprise` (:3002).

## Dev

```bash
# Terminal A — consulting backend
npm run enterprise:dev

# Terminal B — public site
npm run website:dev
```

Open http://127.0.0.1:3003  

Set `NEXT_PUBLIC_ENTERPRISE_URL` if enterprise is not on `http://127.0.0.1:3002`.

## Journey

```
Landing → Describe business → Discovery interview → Blueprint package
  → (later) Commercial approval → Factory
```

Customers never see prompts or DNA.
