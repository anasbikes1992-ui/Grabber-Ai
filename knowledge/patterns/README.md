# Pattern Library

Don't store code — store **solutions**. A pattern is a proven, generalized
answer to a recurring problem, with examples and a reusable template. The AI
reuses proven patterns instead of reinventing (CO-03, AN-01, AR-07).

## Structure

```
patterns/
  <domain>/                 e.g. authentication/, payments/, booking/
    <pattern>.md            e.g. oauth-oidc.md, supabase-auth.md, jwt-sessions.md
```

## Pattern entry format (PATTERN-TEMPLATE.md)

Every pattern documents: Problem · Context (when to use / when not) ·
Solution · Trade-offs · Standards it satisfies (rule ids) · Examples
(links to `knowledge/examples/`) · Reusable Template (link to
`/templates` or `knowledge/components/`) · Related EDRs · Version.

## Rules

- A solution used in a second project MUST be proposed as a pattern (Rule 3).
- Patterns enter through the curation gate (03-KNOWLEDGE-ENGINE §4).
- Patterns are graph nodes: linked to industries, features, components, and EDRs.
- An agent solving a problem covered by a pattern without using it (or filing
  an EDR explaining why not) fails validation.
