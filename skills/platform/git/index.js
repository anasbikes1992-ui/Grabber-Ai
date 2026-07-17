// skill.platform.git — first-party skill module (manifest-first, EDR-005)
export const actions = {
  describe: async () => ({ id: 'skill.platform.git', capabilities: ["git.status","git.commit","git.diff"] }),
  status: async (args = {}) => ({ ok: true, action: 'status', skill: 'skill.platform.git', args, note: 'Action body deepens with Development Factory (v1.8); contract is live.' }),
  commit: async (args = {}) => ({ ok: true, action: 'commit', skill: 'skill.platform.git', args, note: 'Action body deepens with Development Factory (v1.8); contract is live.' }),
  diff: async (args = {}) => ({ ok: true, action: 'diff', skill: 'skill.platform.git', args, note: 'Action body deepens with Development Factory (v1.8); contract is live.' }),
};

export async function initialize() {
  return { actions };
}
