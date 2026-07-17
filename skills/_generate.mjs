import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const catalog = JSON.parse(readFileSync(new URL('./catalog.json', import.meta.url), 'utf8'));
const names = {
  'skill.platform.git': 'Git',
  'skill.platform.filesystem': 'Filesystem',
  'skill.platform.docker': 'Docker',
  'skill.platform.terminal': 'Terminal',
  'skill.platform.http': 'HTTP',
  'skill.language.typescript': 'TypeScript',
  'skill.language.python': 'Python',
  'skill.language.php': 'PHP',
  'skill.language.dart': 'Dart',
  'skill.framework.nextjs': 'Next.js',
  'skill.framework.laravel': 'Laravel',
  'skill.framework.flutter': 'Flutter',
  'skill.framework.react': 'React',
  'skill.infra.postgresql': 'PostgreSQL',
  'skill.infra.redis': 'Redis',
  'skill.infra.qdrant': 'Qdrant',
  'skill.infra.minio': 'MinIO',
  'skill.integration.supabase': 'Supabase',
  'skill.integration.stripe': 'Stripe',
  'skill.integration.openai': 'OpenAI',
  'skill.integration.github': 'GitHub',
};

for (const s of catalog.skills) {
  const dir = join('skills', s.path);
  mkdirSync(dir, { recursive: true });
  const displayName = names[s.id] || s.id;
  const actionNames = (s.capabilities || []).map((c) => c.split('.').pop());
  const permissions =
    s.category === 'platform' ? ['filesystem', 'shell']
      : s.category === 'integration' ? ['network', 'secrets']
        : ['filesystem'];

  const manifest = {
    id: s.id,
    version: '0.1.0',
    type: 'skill',
    displayName,
    description: `First-party skill: ${displayName} (EDR-005 shortlist)`,
    capabilities: s.capabilities,
    permissions,
    hooks: [],
    dependencies: [],
    entry: './index.js',
    metadata: {
      category: s.category,
      knowledge: [],
      patterns: [],
      examples: [],
      tests: ['manifest-valid'],
      firstParty: true,
    },
  };
  writeFileSync(join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  const actionLines = actionNames.map((name) =>
    `  ${name}: async (args = {}) => ({ ok: true, action: '${name}', skill: '${s.id}', args, note: 'Action body deepens with Development Factory (v1.8); contract is live.' }),`).join('\n');

  const index = `// ${s.id} — first-party skill module (manifest-first, EDR-005)
export const actions = {
  describe: async () => ({ id: '${s.id}', capabilities: ${JSON.stringify(s.capabilities)} }),
${actionLines}
};

export async function initialize() {
  return { actions };
}
`;
  writeFileSync(join(dir, 'index.js'), index);
  writeFileSync(
    join(dir, 'README.md'),
    `# ${displayName}\n\nFirst-party skill (EDR-005). Manifest + action contracts live; deep implementations track Development Factory.\n`,
  );
}

console.log(`wrote ${catalog.skills.length} skills`);
