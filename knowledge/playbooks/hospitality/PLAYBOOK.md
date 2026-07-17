# Industry Playbook — Hospitality / Hotels

**Status:** Seed (v1)  
**Golden reference:** Booking (`blueprint.booking`)  
**Program:** Business OS · Delivery Governance

---

## Typical workflows

1. Guest discovers property / service  
2. Checks availability (calendar)  
3. Books slot or stay  
4. Pays (deposit / full)  
5. Receives confirmation notification  
6. Provider manages calendar & fulfillments  
7. Guest leaves review  
8. Ops views analytics  

---

## Required modules (Factory Registry)

```
authentication, teams, rbac, calendar, booking, payments,
notifications, reviews, search, files, analytics
```

Optional: `customers`, `audit`, `billing`

---

## Compliance considerations

- Payment data: PCI via Stripe (never store PAN)  
- Guest PII: retention policy, access control (RBAC)  
- Cancellation / refund policy must be in SOW  

---

## Common integrations

- Supabase (auth, data, storage)  
- Stripe (payments)  
- GitHub + Vercel (delivery)  
- Email/SMS notifications (future connector)  

---

## Suggested upsells

- Multi-property / multi-team  
- Membership / loyalty  
- Advanced analytics  
- Channel manager integrations  
- Maintenance SLA  

---

## Risk checklist

- [ ] Timezone / availability edge cases  
- [ ] Double-booking prevention  
- [ ] Refund / no-show policy  
- [ ] Provider vs guest permissions  
- [ ] Deposit received before factory build  

---

## Discovery question bank

See `discovery-questions.json`.
