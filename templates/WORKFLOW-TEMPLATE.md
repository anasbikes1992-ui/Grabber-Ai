# WORKFLOW TEMPLATE

Every workflow in `/pipelines` uses this format.

---

# Workflow — <Name>

**Pipeline:** planning | development | testing | deployment · **Version:** x.y.z

## Trigger
What starts this workflow (event, stage transition, schedule, human request).

## Preconditions
State that must hold before execution (gates passed, artifacts present).

## Inputs
Typed input artifacts.

## Processing
Ordered steps. Each step names: the agent, the action, the knowledge queries,
and the standards applied.

## Validation
Validator, rubric, threshold. Failure behavior: structured correction list →
loop back; two failures → escalate.

## Outputs
Typed output artifacts and where they are stored.

## Logging
What is recorded: routing decisions, scores, token cost, duration,
interventions (feeds 01 §6 metrics).

## Recovery
Rollback/retry behavior on partial failure.

## Completion
Objective condition that marks the workflow done and advances the stage.
