# Wholesale Distribution (incl. Textile Raw Materials)

**Patterns only.** Use for discovery, gap analysis, and capability recommendations.  
Do not copy proprietary ERP UIs, code, or confidential implementations.

## Typical business profile

- Import and/or local supply of bulk materials (e.g. textile yarn, greige, finished fabrics)
- One or more warehouses; B2B customers; often credit sales
- Purchasing, receiving, quality, stock, sales orders, invoicing, collections

## Standard operational flows

1. **Procure** — RFQ / PO / supplier confirmation  
2. **Inbound** — container or truck → QC → put-away  
3. **Inventory** — SKU / lot / roll / location balances  
4. **Sell** — quote → order → pick/pack → dispatch → invoice  
5. **Credit** — limits, aging, holds  
6. **Finance** — landed cost, COGS, payables  

## Capability tiers

See `capabilities.json`. Essential = cannot run wholesale without. Recommended = quality/ops maturity. Advanced = differentiation / scale.

## Benchmark systems (public patterns)

ERPNext · Odoo · SAP Business One · NetSuite · Zoho Inventory-class tools  

Learn **modules, workflows, reports, integrations** — never source or pixel UI.
