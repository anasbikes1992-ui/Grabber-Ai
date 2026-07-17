# Product Factory (v1.8 / EDR-007)

**Track B — Product Engineering.** Generates complete product blueprints from
Project DNA via deterministic Artifact Builders scheduled on the Intelligent
Execution Platform.

```
Project DNA → Discovery → Requirements → Architecture → API → Database
  → Frontend → Backend → Tests → Security → Deployment → Documentation → Release
```

Builders are **not agents**. Agents may later specialize steps; builders are
the stable, regen-equivalent path.

```js
import { createProductFactory } from './index.js';

const factory = createProductFactory();
const plan = factory.plan(dna);
const build = await factory.build(dna);
factory.validate(build);
factory.deploy(build);
await factory.regenerate(dna); // equivalence KPI
```

Wall KPI: **time from Project DNA to validated deployable application.**
