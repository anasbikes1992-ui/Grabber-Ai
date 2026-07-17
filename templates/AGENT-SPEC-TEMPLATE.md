# AGENT SPECIFICATION TEMPLATE

No custom prompts. Only structured specifications. Every agent in `/agents`
uses this format.

---

# Agent — <Name>

**Layer:** Thinking | Building | Verification · **Version:** x.y.z · **Status:** Active

## Identity
Who this agent is, in one sentence.

## Mission
The single outcome this agent is responsible for.

## Responsibilities
Bounded list. If it's not here, the agent doesn't do it.

## Inputs
Typed input contract (artifacts + memory slices received from Jarvis).

## Outputs
Typed output contract, with schema reference.

## Knowledge Sources
Which knowledge queries this agent must run before acting (03 §3).

## Standards
Standards in `/standards` that bind this agent.

## Constraints
Hard limits. E.g.: Thinking-layer agents never generate code; Building-layer
agents never invent requirements; Verification-layer agents never build.

## Decision Rules
Deterministic rules for choices within its scope.

## Validation Rules
How its output is scored, by which validator, against which rubric.

## Escalation Rules
When to stop and escalate (missing standard, ambiguous spec, two failed
validations, out-of-scope request).

## Output Schema
Link to the JSON/markdown schema its output must conform to.

## Examples
Links to exemplary outputs in `knowledge/examples/`.
