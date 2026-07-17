// skill.language.dart — first-party skill module (manifest-first, EDR-005)
export const actions = {
  describe: async () => ({ id: 'skill.language.dart', capabilities: ["lang.dart"] }),
  dart: async (args = {}) => ({ ok: true, action: 'dart', skill: 'skill.language.dart', args, note: 'Action body deepens with Development Factory (v1.8); contract is live.' }),
};

export async function initialize() {
  return { actions };
}
