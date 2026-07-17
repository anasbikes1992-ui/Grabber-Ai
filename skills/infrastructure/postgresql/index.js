// skill.infra.postgresql — production-shaped actions (EDR-007)
export const actions = {
  describe: async () => ({
    id: 'skill.infra.postgresql',
    capabilities: ['db.postgresql', 'migrations'],
  }),

  planMigration: async (args = {}) => {
    const { tables = [] } = args;
    return {
      ok: true,
      migrations: tables.map((t) => ({
        up: `CREATE TABLE IF NOT EXISTS ${t.name} (id uuid PRIMARY KEY);`,
        down: `DROP TABLE IF EXISTS ${t.name};`,
      })),
    };
  },

  validateNaming: async (args = {}) => {
    const { naming = 'plural', tables = [] } = args;
    const issues = [];
    for (const t of tables) {
      const n = t.name || t;
      if (naming === 'plural' && !String(n).endsWith('s')) {
        issues.push({ table: n, issue: 'expected plural name (DB-03)' });
      }
    }
    return { ok: issues.length === 0, issues };
  },
};

export async function initialize() {
  return { actions };
}
