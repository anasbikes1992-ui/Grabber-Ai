// skill.integration.supabase — production-shaped actions (EDR-007)
export const actions = {
  describe: async () => ({
    id: 'skill.integration.supabase',
    capabilities: ['int.supabase', 'auth', 'database', 'storage'],
  }),

  planProject: async (args = {}) => {
    const { name, region = 'us-east-1' } = args;
    if (!name) return { ok: false, error: 'name required' };
    return {
      ok: true,
      dryRun: true,
      plan: {
        project: name,
        region,
        services: ['auth', 'postgres', 'storage', 'realtime'],
        rls: 'required',
      },
    };
  },

  planSchemaFromFactory: async (args = {}) => {
    const { tables = [] } = args;
    return {
      ok: true,
      migrations: tables.map((t, i) => ({
        id: String(i + 1).padStart(3, '0'),
        sql: `-- create ${t.name}\n-- columns: ${(t.columns || []).map((c) => c.name).join(', ')}`,
      })),
    };
  },

  planAuth: async (args = {}) => ({
    ok: true,
    providers: args.providers ?? ['email'],
    rls_templates: ['user_owns_row', 'tenant_isolation'],
  }),
};

export async function initialize() {
  return { actions };
}
