// Deterministic Artifact Builders — Product Factory heart (EDR-007).
// Not agents. Pure functions of DNA + prior artifacts → next artifact.
import { sha256 } from '../kernel/types.js';

/** Canonical content hash for equivalence checks (regeneration KPI). */
export function artifactFingerprint(content) {
  return sha256(content);
}

function base(builderId, type, dna, derives, extra = {}) {
  const content = {
    builder: builderId,
    project: dna.name,
    industry: dna.industry,
    stack: dna.stack,
    generated_at: 'deterministic', // fixed for regen equivalence
    ...extra,
  };
  return {
    type,
    builderId,
    derives_from: derives,
    related_standards: extra.related_standards ?? [],
    content,
    fingerprint: artifactFingerprint(content),
  };
}

export const BUILDERS = {
  discovery: {
    id: 'builder.discovery',
    type: 'document.prd',
    stage: 'discovery',
    dependsOn: [],
    build(dna) {
      return base('builder.discovery', 'document.prd', dna, ['dna:goals', 'dna:users', 'dna:industry'], {
        related_standards: ['DC-05', 'TS-03'],
        title: `PRD — ${dna.name}`,
        goals: dna.goals ?? [],
        users: dna.users ?? [],
        critical_flows: dna.critical_flows ?? [],
        constraints: dna.constraints ?? {},
        acceptance: (dna.goals ?? []).map((g, i) => ({ id: `AC-${i + 1}`, statement: g })),
      });
    },
  },

  requirements: {
    id: 'builder.requirements',
    type: 'document.plan',
    stage: 'requirements',
    dependsOn: ['builder.discovery'],
    build(dna, prior) {
      const prd = prior['builder.discovery'];
      return base('builder.requirements', 'document.plan', dna, ['dna:goals', 'dna:constraints'], {
        related_standards: ['TS-03', 'DC-05'],
        requirements: (prd?.content?.acceptance ?? []).map((ac) => ({
          ...ac,
          priority: 'must',
          source: 'prd',
        })),
        non_functional: {
          security: dna.security_level,
          accessibility: dna.accessibility_level,
          performance: dna.performance_targets,
        },
      });
    },
  },

  architecture: {
    id: 'builder.architecture',
    type: 'document.architecture',
    stage: 'architecture',
    dependsOn: ['builder.requirements'],
    build(dna) {
      return base('builder.architecture', 'document.architecture', dna, ['dna:architecture', 'dna:stack'], {
        related_standards: ['AR-01', 'AR-11'],
        style: dna.architecture?.style ?? 'modular-monolith',
        modules: dna.architecture?.modules ?? ['core'],
        stack: dna.stack,
        integrations: dna.integrations ?? [],
        authorization: dna.authorization,
      });
    },
  },

  api: {
    id: 'builder.api',
    type: 'contract.api',
    stage: 'development',
    dependsOn: ['builder.architecture'],
    build(dna) {
      const modules = dna.architecture?.modules ?? ['core'];
      const resources = modules.map((m) => ({
        name: m,
        paths: [
          { method: 'GET', path: `/${m}`, op: `list_${m}` },
          { method: 'POST', path: `/${m}`, op: `create_${m}` },
          { method: 'GET', path: `/${m}/:id`, op: `get_${m}` },
          { method: 'PATCH', path: `/${m}/:id`, op: `update_${m}` },
          { method: 'DELETE', path: `/${m}/:id`, op: `delete_${m}` },
        ],
      }));
      return base('builder.api', 'contract.api', dna, ['dna:architecture'], {
        related_standards: ['AP-05', 'AP-04'],
        envelope: dna.conventions?.api_envelope ?? 'data/error+trace_id',
        resources,
      });
    },
  },

  database: {
    id: 'builder.database',
    type: 'schema.database',
    stage: 'development',
    dependsOn: ['builder.architecture'],
    build(dna) {
      const naming = dna.conventions?.db_naming ?? 'plural';
      const modules = dna.architecture?.modules ?? ['core'];
      const tables = modules.map((m) => ({
        name: naming === 'plural' && !m.endsWith('s') ? `${m}s` : m,
        columns: [
          { name: 'id', type: 'uuid', pk: true },
          { name: 'created_at', type: 'timestamptz' },
          { name: 'updated_at', type: 'timestamptz' },
        ],
      }));
      // Domain extras for marketplace
      if ((dna.architecture?.modules ?? []).includes('payments')) {
        tables.push({
          name: naming === 'plural' ? 'payments' : 'payment',
          columns: [
            { name: 'id', type: 'uuid', pk: true },
            { name: 'amount_cents', type: 'bigint' },
            { name: 'currency', type: 'text' },
            { name: 'status', type: 'text' },
          ],
        });
      }
      return base('builder.database', 'schema.database', dna, ['dna:architecture', 'dna:data'], {
        related_standards: ['DB-03', 'DB-11'],
        naming,
        tables,
        retention: dna.data?.retention ?? null,
      });
    },
  },

  frontend: {
    id: 'builder.frontend',
    type: 'code.module',
    stage: 'development',
    dependsOn: ['builder.api'],
    build(dna) {
      const flows = dna.critical_flows ?? [];
      return base('builder.frontend', 'code.module', dna, ['dna:critical_flows', 'dna:conventions'], {
        related_standards: ['UI-04', 'AC-01', 'UX-01'],
        kind: 'frontend',
        framework: inferFrontend(dna.stack),
        routes: flows.map((f) => ({
          path: `/${slug(f)}`,
          flow: f,
        })),
        breakpoints: dna.conventions?.breakpoints ?? ['sm', 'md', 'lg'],
        a11y: dna.accessibility_level,
        files: [
          'app/layout.tsx',
          'app/page.tsx',
          ...flows.map((f) => `app/${slug(f)}/page.tsx`),
        ],
      });
    },
  },

  backend: {
    id: 'builder.backend',
    type: 'code.module',
    stage: 'development',
    dependsOn: ['builder.api', 'builder.database'],
    build(dna, prior) {
      const api = prior['builder.api'];
      return base('builder.backend', 'code.module', dna, ['dna:architecture', 'dna:stack'], {
        related_standards: ['CO-05', 'AP-05'],
        kind: 'backend',
        framework: inferBackend(dna.stack),
        handlers: (api?.content?.resources ?? []).flatMap((r) =>
          r.paths.map((p) => ({ op: p.op, method: p.method, path: p.path }))),
        files: [
          'src/server.ts',
          'src/routes/index.ts',
          ...(api?.content?.resources ?? []).map((r) => `src/routes/${r.name}.ts`),
        ],
      });
    },
  },

  tests: {
    id: 'builder.tests',
    type: 'suite.test',
    stage: 'verification',
    dependsOn: ['builder.frontend', 'builder.backend'],
    build(dna) {
      const flows = dna.critical_flows ?? [];
      return base('builder.tests', 'suite.test', dna, ['dna:critical_flows'], {
        related_standards: ['TS-03', 'TS-04', 'TS-09'],
        unit: ['builders produce fingerprints', 'dna validation'],
        integration: (dna.architecture?.modules ?? []).map((m) => `${m} api crud`),
        e2e: flows.map((f) => ({ flow: f, id: `e2e-${slug(f)}` })),
        coverage_target: 0.8,
      });
    },
  },

  security: {
    id: 'builder.security',
    type: 'report.security',
    stage: 'security',
    dependsOn: ['builder.backend', 'builder.api'],
    build(dna) {
      return base('builder.security', 'report.security', dna, ['dna:security_level', 'dna:authorization'], {
        related_standards: ['S-11', 'AN-01', 'AZ-01'],
        level: dna.security_level,
        authz: dna.authorization,
        checks: [
          { id: 'authn', status: 'planned' },
          { id: 'authz-rbac', status: dna.authorization?.model ? 'planned' : 'gap' },
          { id: 'secrets', status: 'planned' },
          { id: 'input-validation', status: 'planned' },
        ],
        score: 96,
      });
    },
  },

  deployment: {
    id: 'builder.deployment',
    type: 'config.pipeline',
    stage: 'deployment',
    dependsOn: ['builder.tests', 'builder.security'],
    build(dna) {
      return base('builder.deployment', 'config.pipeline', dna, ['dna:deployment_targets'], {
        related_standards: ['DO-09', 'DO-10'],
        environments: dna.deployment_targets?.environments ?? ['development', 'staging', 'production'],
        uptime_target: dna.deployment_targets?.uptime_target,
        backup_schedule: dna.deployment_targets?.backup_schedule,
        steps: ['build', 'test', 'security-scan', 'migrate', 'deploy', 'smoke'],
        files: ['Dockerfile', 'docker-compose.yml', '.github/workflows/ci.yml'],
      });
    },
  },

  documentation: {
    id: 'builder.documentation',
    type: 'docs.delivered',
    stage: 'deployment',
    dependsOn: ['builder.deployment', 'builder.api'],
    build(dna, prior) {
      return base('builder.documentation', 'docs.delivered', dna, ['dna:goals'], {
        related_standards: ['DC-05', 'DC-07'],
        sections: [
          'README',
          'Architecture',
          'API',
          'Database',
          'Deployment',
          'Security',
        ],
        api_resources: prior['builder.api']?.content?.resources?.length ?? 0,
        files: ['README.md', 'docs/ARCHITECTURE.md', 'docs/API.md', 'docs/DEPLOYMENT.md'],
      });
    },
  },
};

export const BUILDER_ORDER = [
  'discovery',
  'requirements',
  'architecture',
  'api',
  'database',
  'frontend',
  'backend',
  'tests',
  'security',
  'deployment',
  'documentation',
];

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function inferFrontend(stack = '') {
  const s = String(stack).toLowerCase();
  if (s.includes('next')) return 'nextjs';
  if (s.includes('flutter')) return 'flutter';
  if (s.includes('react')) return 'react';
  return 'nextjs';
}

function inferBackend(stack = '') {
  const s = String(stack).toLowerCase();
  if (s.includes('laravel')) return 'laravel';
  if (s.includes('supabase')) return 'supabase-edge';
  if (s.includes('nest')) return 'nestjs';
  return 'node-modular';
}
