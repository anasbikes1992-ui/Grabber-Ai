// skill.platform.terminal — first-party skill module (manifest-first, EDR-005)
export const actions = {
  describe: async () => ({ id: 'skill.platform.terminal', capabilities: ["shell.exec"] }),
  exec: async (args = {}) => ({ ok: true, action: 'exec', skill: 'skill.platform.terminal', args, note: 'Action body deepens with Development Factory (v1.8); contract is live.' }),
};

export async function initialize() {
  return { actions };
}
