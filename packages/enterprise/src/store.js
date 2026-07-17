import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
} from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

export function dataRoot(cwd = process.cwd()) {
  const env = process.env.GRABBER_ENTERPRISE_DIR;
  if (env) return env;
  // Prefer monorepo root .grabber/enterprise when run from packages or apps
  const candidates = [
    join(cwd, '.grabber', 'enterprise'),
    join(cwd, '..', '..', '.grabber', 'enterprise'),
    join(cwd, '..', '.grabber', 'enterprise'),
  ];
  for (const c of candidates) {
    // use first writable path we can create
    try {
      mkdirSync(c, { recursive: true });
      return c;
    } catch {
      /* next */
    }
  }
  const fallback = join(cwd, '.grabber', 'enterprise');
  mkdirSync(fallback, { recursive: true });
  return fallback;
}

export function collectionPath(name, cwd) {
  const dir = join(dataRoot(cwd), name);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function save(collection, record, cwd) {
  if (!record.id) record.id = randomUUID().slice(0, 12);
  if (!record.created_at) record.created_at = new Date().toISOString();
  record.updated_at = new Date().toISOString();
  const path = join(collectionPath(collection, cwd), `${record.id}.json`);
  writeFileSync(path, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  return record;
}

export function get(collection, id, cwd) {
  const path = join(collectionPath(collection, cwd), `${id}.json`);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function list(collection, cwd) {
  const dir = collectionPath(collection, cwd);
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')))
    .sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
}

export function remove(collection, id, cwd) {
  const path = join(collectionPath(collection, cwd), `${id}.json`);
  if (!existsSync(path)) return false;
  writeFileSync(path, ''); // soft: keep file empty marker
  return true;
}
