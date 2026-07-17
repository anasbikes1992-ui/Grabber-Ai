# Pattern: Inventory master & valuation

**Outcome:** Single source of truth for SKU, lot/roll, and cost.

## Design principles

- SKU master separate from on-hand balances
- Lot/batch/roll attributes when industry needs them
- Cost layers or average cost with landed cost hooks
- Audit log on every adjustment

## Not allowed

Reproducing proprietary costing engines or branded report layouts.
