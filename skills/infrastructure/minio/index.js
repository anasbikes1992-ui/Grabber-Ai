// skill.infra.minio — first-party skill module (manifest-first, EDR-005)
export const actions = {
  describe: async () => ({ id: 'skill.infra.minio', capabilities: ["object.minio"] }),
  minio: async (args = {}) => ({ ok: true, action: 'minio', skill: 'skill.infra.minio', args, note: 'Action body deepens with Development Factory (v1.8); contract is live.' }),
};

export async function initialize() {
  return { actions };
}
