# Pattern: Warehouse operations

**Outcome:** Accurate stock by location with fast receiving and transfers.

## Common workflow

Receive → inspect → put-away → pick → pack → ship → adjust

## Design principles (original implementation)

- Location-level balances (warehouse / zone / bin as needed)
- Explicit stock movement documents (not silent edits)
- Mobile-first receiving for operators
- Exception queues for variance and damage

## Not allowed

Copying proprietary WMS screens, icons, or source from any vendor.
