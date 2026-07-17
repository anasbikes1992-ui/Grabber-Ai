# Reference Projects — platform regression suite (EDR-007)

Not templates. **Golden DNA + expected regeneration behavior.**

Every platform change should:

1. Run Product Factory on each reference DNA
2. Assert regeneration equivalence (two runs, same fingerprints)
3. Assert validation pass, cost within budget, zero intervention, replayable

```bash
cd runtime && node --test test/product-factory.test.js
```

| Project | Domain stress |
|---------|----------------|
| saas-starter | multi-tenant baseline |
| crm | workflows / pipeline |
| marketplace | payments, inventory, search, files, RBAC |
