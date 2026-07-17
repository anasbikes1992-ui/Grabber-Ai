# Delivery Governance

**Status:** Spec for Enterprise v3.0 (Milestone 1)  
**Rule:** Nothing enters the Product Factory until this gate is satisfied.

---

## Purpose

Prevent scope creep, protect margin, and ensure commercial alignment **before**
deterministic manufacturing begins.

---

## Gate sequence

```
Client
  → Discovery
  → Business Analysis
  → Solution Design
  → Commercial Review
  → Risk Review
  → Legal Review
  → Internal Approval
  → Client Approval
  → Deposit Received
  → Factory Build   ← Product Factory (existing, frozen Core)
```

| Stage | Owner | Exit criteria |
|-------|--------|----------------|
| Discovery | Business OS | Industry playbook applied; stakeholders identified |
| Business Analysis | Analyst / AI | Pain points, processes, opportunities documented |
| Solution Design | Solution / CTO | Modules + integrations proposed; DNA draft |
| Commercial Review | Sales / Finance | Quote, timeline, margin acceptable |
| Risk Review | Delivery lead | Risk register accepted |
| Legal Review | Legal / ops | MSA/SOW draft path clear |
| Internal Approval | CTO / lead | Sign-off record |
| Client Approval | Client | Signed scope / proposal |
| Deposit Received | Finance | Payment confirmed |
| Factory Build | Product Factory | Approved Project DNA only |

---

## Factory entry contract

Product Factory **must** receive:

1. Approved **Project DNA** (rich + Core-compatible)  
2. Governance record id (who approved, when)  
3. Commercial package refs (proposal / SOW ids)  
4. Quality floor (confidence / completeness thresholds met)

If deposit or client approval is missing → **block** `grabber build` / factory submit.

---

## Anti-patterns

- Jumping from chat to `grabber build`  
- DNA without commercial scope  
- Factory changes to “fit” an unapproved client request  
- Mixing Marketing Intelligence content with delivery DNA  

---

## Relationship to Product Factory

Governance is **upstream**.  
Factory is **downstream** and unchanged.

```
Business OS + Governance  →  Project DNA (approved)
                                    ↓
                         Product Factory v2.0 (existing)
                                    ↓
                              Deployment + Metrics
```
