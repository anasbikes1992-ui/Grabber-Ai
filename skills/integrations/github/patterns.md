# Patterns

1. **Dry-run first** — every mutating action returns a plan unless `execute: true`.
2. **Repo-per-product** — Product Factory deployment builder emits CI workflow paths.
3. **Branch protection** — main requires status checks from factory test suite.
