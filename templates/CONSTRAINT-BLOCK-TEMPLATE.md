# CONSTRAINT BLOCK TEMPLATE (The Constraint Engine)

Missing constraints are the biggest cause of AI errors. Every task prompt
assembled by Jarvis MUST include this block (18-PROMPT PR-04); the agent
reasons **within** these boundaries instead of guessing.

Seeded from the Project DNA `constraints` section, then specialized per task
by the Planner.

---

```yaml
constraints:
  must: []        # hard requirements — output failing any of these is rejected
  should: []      # strong defaults — deviation requires stated justification
  may: []         # explicitly permitted freedoms
  must_not: []    # prohibitions — violation fails validation immediately
  assumptions: [] # believed true; agent flags output that depends on one
  unknowns: []    # open questions — NEVER resolved by invention (PR-05);
                  # agent escalates or marks the dependency for validator review
  risks: []       # known risks the agent must not aggravate
```

## Validator behavior

- Output violating a `must` or `must_not` → rejected with the violated item cited.
- Output silently resolving an `unknown` → rejected (Rule 4: AI never guesses).
- `should` deviations without justification → correction list.
- An empty constraint block on a decision-bearing task → the task itself fails
  pre-execution validation.
