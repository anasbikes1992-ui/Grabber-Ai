import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const KNOWN = [
  'hospitality',
  'restaurants',
  'retail',
  'logistics',
  'healthcare',
  'education',
  'manufacturing',
  'construction',
  'real-estate',
  'legal',
  'finance',
];

export function playbooksRoot(cwd = process.cwd()) {
  const candidates = [
    join(cwd, 'knowledge', 'playbooks'),
    join(cwd, '..', '..', 'knowledge', 'playbooks'),
    join(cwd, '..', 'knowledge', 'playbooks'),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return candidates[0];
}

export function listIndustries(cwd) {
  const root = playbooksRoot(cwd);
  if (!existsSync(root)) return KNOWN.map((id) => ({ id, status: 'planned' }));
  const dirs = readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => d.name);
  return KNOWN.map((id) => ({
    id,
    status: dirs.includes(id) ? 'seed' : 'planned',
    path: dirs.includes(id) ? join(root, id) : null,
  }));
}

export function loadPlaybook(industry, cwd) {
  const root = join(playbooksRoot(cwd), industry);
  if (!existsSync(root)) {
    return {
      industry,
      status: 'planned',
      questions: defaultQuestions(industry),
      modules: { required: ['authentication', 'rbac'], optional: [] },
      integrations: { required: ['supabase', 'github', 'vercel'], optional: [] },
      risks: [],
      upsells: [],
    };
  }
  const readJson = (name, fallback) => {
    const p = join(root, name);
    if (!existsSync(p)) return fallback;
    return JSON.parse(readFileSync(p, 'utf8'));
  };
  const playbookMd = existsSync(join(root, 'PLAYBOOK.md'))
    ? readFileSync(join(root, 'PLAYBOOK.md'), 'utf8')
    : '';
  const questions = readJson('discovery-questions.json', { questions: defaultQuestions(industry) });
  return {
    industry,
    status: 'seed',
    body: playbookMd,
    questions: questions.questions || questions,
    modules: readJson('modules.json', { required: [], optional: [] }),
    integrations: readJson('integrations.json', { required: [], optional: [] }),
    risks: readJson('risks.json', { risks: [] }).risks || [],
    upsells: readJson('upsells.json', { upsells: [] }).upsells || [],
  };
}

function defaultQuestions(industry) {
  return [
    {
      id: `${industry}-01`,
      section: 'business',
      prompt: `What is the primary business process for this ${industry} organization?`,
      required: true,
    },
    {
      id: `${industry}-02`,
      section: 'users',
      prompt: 'Who are the primary user roles and their goals?',
      required: true,
    },
    {
      id: `${industry}-03`,
      section: 'success',
      prompt: 'What does success look like in 90 days?',
      required: true,
    },
    {
      id: `${industry}-04`,
      section: 'integrations',
      prompt: 'Which systems must integrate (payments, auth, ERP, etc.)?',
      required: false,
    },
  ];
}

/**
 * Tailor discovery: merge playbook questions + client context.
 */
export function buildDiscoveryScript(industry, clientName, cwd) {
  const pb = loadPlaybook(industry, cwd);
  return {
    industry,
    client: clientName,
    intro: `Discovery for ${clientName} (${industry}). Use industry playbook; do not use generic-only questions.`,
    questions: pb.questions,
    suggested_modules: pb.modules.required || [],
    suggested_integrations: pb.integrations.required || [],
    risks_to_probe: (pb.risks || []).map((r) => r.description || r),
    upsells: pb.upsells || [],
  };
}
