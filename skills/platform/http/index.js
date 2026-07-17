// skill.platform.http — first-party skill module (manifest-first, EDR-005)
export const actions = {
  describe: async () => ({ id: 'skill.platform.http', capabilities: ["http.request"] }),
  request: async (args = {}) => ({ ok: true, action: 'request', skill: 'skill.platform.http', args, note: 'Action body deepens with Development Factory (v1.8); contract is live.' }),
};

export async function initialize() {
  return { actions };
}
