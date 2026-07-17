# Quality Gates — Production Handbook

**Every project passes the same gates. No gate skipped. No exceptions.**

This is the operational handbook, not architecture. Owning EDR: [EDR-008](../decisions/EDR-008-execution-quality-milestone.md).
Constitutional rule: *every automation introduced must eliminate manual effort without reducing governance.*

```
Proposal Gate → Commercial Gate → Governance Gate → Architecture Gate
  → Implementation Gate → Verification Gate → Human Approval
  → Deployment Gate → Support Gate → Knowledge Gate
```

---

## 1. Proposal Gate

| | |
|---|---|
| **Enters** | Completed discovery + business analysis |
| **Passes when** | Recommendations trace to evidence · investment + ROI estimated · executive report generated |
| **Owner** | Consultant |

## 2. Commercial Gate

| | |
|---|---|
| **Enters** | Client-accepted proposal |
| **Passes when** | SOW/MSA signed · invoice issued · deposit received |
| **Owner** | Finance |

## 3. Governance Gate

| | |
|---|---|
| **Enters** | Paid engagement |
| **Passes when** | Business DNA approved · scope frozen · risks registered · EDRs consulted |
| **Owner** | Owner / Consultant |

## 4. Architecture Gate

| | |
|---|---|
| **Enters** | Approved DNA via Execution Orchestrator |
| **Passes when** | Technical DNA + architecture + task graph reviewed and approved by developer |
| **Owner** | Reviewer (Architect) |

## 5. Implementation Gate

| | |
|---|---|
| **Enters** | Approved task graph |
| **Passes when** | All tasks complete · module library evaluated for reuse (in **and** out) |
| **Owner** | Developer |

## 6. Verification Gate

| | |
|---|---|
| **Enters** | Implemented work |
| **Passes when** | Compile · typecheck · lint · tests · security · accessibility · performance · architecture validation · business-rule validation · regression — **all pass, none skipped** |
| **Owner** | Automated + Reviewer |

## 7. Human Approval

| | |
|---|---|
| **Enters** | Fully verified build |
| **Passes when** | A named human explicitly approves for production. **Production never happens directly from the Factory.** |
| **Owner** | Owner / Reviewer |

## 8. Deployment Gate

| | |
|---|---|
| **Enters** | Approved build |
| **Passes when** | Deployed · monitoring live · rollback path confirmed · client notified |
| **Owner** | Developer |

## 9. Support Gate

| | |
|---|---|
| **Enters** | Live deployment |
| **Passes when** | Support channel active · warranty terms in effect · enhancement backlog opened |
| **Owner** | Consultant |

## 10. Knowledge Gate

| | |
|---|---|
| **Enters** | Delivered engagement (success **or** failure) |
| **Passes when** | Lessons recorded regardless of outcome · evidence captured · reusable components promoted to module library · playbooks updated |
| **Owner** | Everyone |

---

## Rules

1. Gates run in order; a failed gate blocks all downstream gates.
2. A gate can only be re-entered after the failure reason is recorded.
3. No automation may bypass a gate — automation accelerates gates, never removes them.
4. Gate outcomes are structured (PASS / FAIL / NEEDS-CHANGES), never free-form.
