// skill.integration.github — production-shaped actions (EDR-007 deepen)
/** @typedef {{ token?: string, owner?: string, repo?: string }} GithubCtx */

export const actions = {
  describe: async () => ({
    id: 'skill.integration.github',
    capabilities: ['int.github', 'git.pr', 'git.repo'],
    transports: ['REST'],
  }),

  /** Plan a repo create (no network unless GITHUB_TOKEN + execute:true). */
  createRepo: async (args = {}) => {
    const { name, private: isPrivate = true, execute = false } = args;
    if (!name) return { ok: false, error: 'name required' };
    const plan = {
      method: 'POST',
      path: '/user/repos',
      body: { name, private: isPrivate, auto_init: true },
    };
    if (!execute) return { ok: true, dryRun: true, plan };
    return { ok: false, error: 'live execute requires connector runtime + secrets (v1.9+)' };
  },

  openPullRequest: async (args = {}) => {
    const { owner, repo, title, head, base = 'main', execute = false } = args;
    if (!owner || !repo || !title || !head) {
      return { ok: false, error: 'owner, repo, title, head required' };
    }
    const plan = {
      method: 'POST',
      path: `/repos/${owner}/${repo}/pulls`,
      body: { title, head, base },
    };
    if (!execute) return { ok: true, dryRun: true, plan };
    return { ok: false, error: 'live execute requires connector runtime + secrets (v1.9+)' };
  },

  listWorkflows: async (args = {}) => {
    const { owner, repo } = args;
    if (!owner || !repo) return { ok: false, error: 'owner, repo required' };
    return {
      ok: true,
      dryRun: true,
      plan: { method: 'GET', path: `/repos/${owner}/${repo}/actions/workflows` },
    };
  },
};

export async function initialize() {
  return { actions };
}
