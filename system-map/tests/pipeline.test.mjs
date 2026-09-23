// node --test system-map/tests
// Repositorio sintético en disco → scan → hechos → IR → validación.

import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { extractFacts } from '../lib/extract.mjs';
import { interpret } from '../lib/interpret.mjs';
import { findSecrets, makeExcerpt, sanitizeText } from '../lib/sanitize.mjs';
import { scanRepository } from '../lib/scan.mjs';
import { validateAgainstRepository, validateArchitecture } from '../lib/validate.mjs';

const COMMIT = 'a'.repeat(40);
const FIXTURE = {
  'package.json': JSON.stringify({ name: 'demo', workspaces: ['api', 'web'] }, null, 2),
  'api/package.json': JSON.stringify({ name: 'api', dependencies: { '@supabase/supabase-js': '^2.0.0' } }, null, 2),
  'api/server.js': [
    'import http from "node:http";',
    'import { Store } from "./store.js";',
    'const store = new Store(process.env.SUPABASE_URL);',
    'http.createServer(async (req, res) => {',
    '  if (req.method === "GET" && routePath === "/health") {',
    '    return res.end("ok");',
    '  }',
    '  if (req.method === "POST" && routePath === "/items") {',
    '    await store.save(req);',
    '  }',
    '});',
  ].join('\n'),
  'api/store.js': [
    'import { createClient } from "@supabase/supabase-js";',
    'export class Store {',
    '  save(x) { return this.db.from("items").insert(x); }',
    '  search(q) { return this.db.rpc("search_items", { q }); }',
    '}',
  ].join('\n'),
  'web/app.ts': [
    'const API_BASE = "https://api.demo.dev";',
    'export const save = (x) => fetch(`${API_BASE}/items`, { method: "POST", body: x });',
    'const apiKey = "sk-proj-abcdefghijklmnopqrstuvwxyz0123456789";',
  ].join('\n'),
  'db/001_init.sql': 'CREATE TABLE IF NOT EXISTS items (id int);\nCREATE EXTENSION IF NOT EXISTS pg_trgm;\n',
  '.github/workflows/nightly.yml': 'name: Nightly\non:\n  schedule:\n    - cron: "0 5 * * *"\njobs:\n  a:\n    steps:\n      - run: node api/store.js\n        env:\n          TOKEN: ${{ secrets.DEMO_TOKEN }}\n',
  'README.md': '# Demo\n\n## Arquitectura\n\nWeb → API → DB.\n',
  '.env': 'SUPABASE_URL=https://secret.supabase.co\n',
  'certs/server.pem': '-----BEGIN PRIVATE KEY-----\nabc\n',
  'secrets/token.txt': 'hunter2',
  'node_modules/x/index.js': 'module.exports = 1;',
  'logo.png': 'binary',
};

const INTERPRETATION = {
  summary: 'Demo',
  technologies: ['Node'],
  groups: [
    { id: 'clients', name: 'Clientes' },
    { id: 'backend', name: 'Backend' },
    { id: 'data', name: 'Datos' },
    { id: 'ops', name: 'Ops' },
  ],
  components: [
    { id: 'web', name: 'Web', type: 'client', group: 'clients', summary: 'SPA', paths: ['web'] },
    { id: 'api', name: 'API', type: 'service', group: 'backend', summary: 'API', paths: ['api/server.js', 'api/package.json'], hosts: ['api.demo.dev'] },
    { id: 'store', name: 'Store', type: 'module', group: 'backend', summary: 'Datos', paths: ['api/store.js'] },
    {
      id: 'db',
      name: 'Postgres',
      type: 'database',
      group: 'data',
      summary: 'DB',
      paths: ['db'],
      packages: ['@supabase/supabase-js'],
      evidence: [{ sql: { file: 'db/001_init.sql', object: 'pg_trgm' } }],
    },
    { id: 'nightly', name: 'Nightly', type: 'job', group: 'ops', summary: 'Cron', paths: ['.github/workflows/nightly.yml'] },
  ],
  relationships: [
    { source: 'web', target: 'api', label: 'REST' },
    {
      source: 'api',
      target: 'db',
      type: 'sql',
      label: 'Documentado',
      evidence: [{ doc: { file: 'README.md', heading: 'Arquitectura' } }],
    },
  ],
  flows: [],
  decisions: [
    { id: 'pg', title: 'Postgres', why: 'Una sola base.', basis: 'observed', evidence: [{ sql: { file: 'db/001_init.sql', object: 'items' } }] },
    { id: 'guess', title: 'Suposición', why: 'Motivo no documentado.', basis: 'inferred', evidence: [{ file: { path: 'README.md', type: 'documentation' } }] },
  ],
  findings: [],
};

let root;
let repo;
let facts;

async function build(interpretation = INTERPRETATION) {
  return interpret({
    project: { slug: 'demo', name: 'Demo', repository: 'acme/demo', branch: 'main' },
    interpretation: structuredClone(interpretation),
    facts,
    files: repo.files,
    directories: repo.directories,
    excluded: repo.excluded,
    languages: {},
    commit: COMMIT,
    committedAt: '2026-01-01T00:00:00Z',
    generatedAt: '2026-01-02T00:00:00Z',
  });
}

before(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'system-map-'));
  for (const [file, content] of Object.entries(FIXTURE)) {
    await mkdir(path.join(root, path.dirname(file)), { recursive: true });
    await writeFile(path.join(root, file), file === 'logo.png' ? Buffer.from([0x89, 0x50, 0, 0]) : content);
  }
  repo = await scanRepository(root);
  facts = extractFacts(repo.files).facts;
});

after(() => rm(root, { recursive: true, force: true }));

describe('scan', () => {
  test('nunca lee secretos, dependencias ni binarios', () => {
    for (const file of ['.env', 'certs/server.pem', 'secrets/token.txt', 'node_modules/x/index.js', 'logo.png']) {
      assert.equal(repo.files.has(file), false, file);
    }
    assert.ok(repo.excluded.secret >= 3);
    assert.ok(repo.files.has('api/server.js'));
  });
});

describe('extract', () => {
  const find = (pred) => facts.filter(pred);
  test('rutas node:http con método y rango del handler', () => {
    const routes = find((f) => f.kind === 'route');
    assert.deepEqual(routes.map((r) => `${r.method} ${r.path}`), ['GET /health', 'POST /items']);
    assert.equal(routes[0].endLine, 7);
  });
  test('imports resueltos a archivos del repo', () => {
    const imp = find((f) => f.kind === 'import' && f.specifier === './store.js')[0];
    assert.equal(imp.resolved, 'api/store.js');
  });
  test('llamadas HTTP desde templates', () => {
    assert.ok(find((f) => f.kind === 'call' && f.path === '/items' && f.file === 'web/app.ts').length);
    assert.ok(find((f) => f.kind === 'host' && f.host === 'api.demo.dev' && f.call).length);
  });
  test('tablas, RPC, objetos SQL y workflows', () => {
    assert.ok(find((f) => f.kind === 'table' && f.name === 'items').length);
    assert.ok(find((f) => f.kind === 'rpc' && f.name === 'search_items').length);
    assert.ok(find((f) => f.kind === 'sql-object' && f.name === 'pg_trgm').length);
    const run = find((f) => f.kind === 'workflow-run')[0];
    assert.deepEqual(run.targets, ['api/store.js']);
  });
  test('variables de entorno: solo el nombre, nunca el valor', () => {
    const env = find((f) => f.kind === 'env').map((f) => f.name);
    assert.ok(env.includes('SUPABASE_URL'));
    assert.ok(env.includes('DEMO_TOKEN'));
    assert.equal(JSON.stringify(facts).includes('secret.supabase.co'), false);
  });
  test('los extractos se sanean', () => {
    assert.equal(JSON.stringify(facts).includes('sk-proj-abcdefghijklmnopqrstuvwxyz'), false);
  });
});

describe('interpret', () => {
  test('detecta relaciones desde los hechos, no desde la interpretación', async () => {
    const { ir, errors } = await build();
    assert.deepEqual(errors, []);
    const webApi = ir.relationships.find((r) => r.id === 'web--api');
    assert.equal(webApi.type, 'http');
    assert.equal(webApi.detected, true);
    assert.equal(webApi.confidence, 'confirmed');
    assert.ok(webApi.endpoints.includes('POST /items'));
    // api→store (import) y store→db (supabase + tablas) aparecen aunque nadie los describió.
    assert.equal(ir.relationships.find((r) => r.id === 'api--store').type, 'import');
    assert.equal(ir.relationships.find((r) => r.id === 'store--db').type, 'sql');
    assert.equal(ir.relationships.find((r) => r.id === 'nightly--store').type, 'invokes');
  });
  test('la documentación sola solo respalda', async () => {
    const { ir } = await build();
    assert.equal(ir.relationships.find((r) => r.id === 'api--db').confidence, 'supported');
  });
  test('una inferencia nunca sube de inferred', async () => {
    const { ir } = await build();
    assert.equal(ir.decisions.find((d) => d.id === 'guess').confidence, 'inferred');
  });
  test('evidencia que no existe rompe la generación', async () => {
    const broken = structuredClone(INTERPRETATION);
    broken.components[0].evidence = [{ pattern: { file: 'web/app.ts', regex: 'noExiste' } }];
    const { errors } = await build(broken);
    assert.ok(errors.some((e) => e.includes('patrón no encontrado')));
  });
  test('cap solo baja la confianza', async () => {
    const capped = structuredClone(INTERPRETATION);
    capped.relationships[0].cap = 'supported';
    const { ir } = await build(capped);
    assert.equal(ir.relationships.find((r) => r.id === 'web--api').confidence, 'supported');
  });
});

describe('validate', () => {
  test('el IR generado es válido y coincide con el repositorio', async () => {
    const { ir } = await build();
    assert.deepEqual(validateArchitecture(ir), []);
    assert.deepEqual(validateAgainstRepository(ir, { commit: COMMIT, files: repo.files, directories: repo.directories }), []);
  });
  test('rechaza confianza mayor que la evidencia', async () => {
    const { ir } = await build();
    ir.relationships.find((r) => r.id === 'api--db').confidence = 'confirmed';
    assert.ok(validateArchitecture(ir).some((e) => e.includes('excede')));
  });
  test('rechaza enlaces que no apuntan al commit analizado', async () => {
    const { ir } = await build();
    ir.components[0].evidence[0].url = ir.components[0].evidence[0].url.replace(COMMIT, 'main');
    assert.ok(validateArchitecture(ir).some((e) => e.includes('fijada al commit')));
  });
  test('rechaza secretos y URLs privadas en el artefacto', async () => {
    const { ir } = await build();
    ir.project.summary = 'token ghp_abcdefghijklmnopqrstuvwxyz0123456789AB';
    ir.components[0].summary = 'ver http://localhost:3000/admin';
    const errors = validateArchitecture(ir);
    assert.ok(errors.some((e) => e.includes('secretos')));
    assert.ok(errors.some((e) => e.includes('URLs privadas')));
  });
  test('rechaza relaciones hacia componentes inexistentes', async () => {
    const { ir } = await build();
    ir.relationships[0].target = 'fantasma';
    assert.ok(validateArchitecture(ir).some((e) => e.includes('no existe')));
  });
  test('detecta extractos que ya no coinciden con el código', async () => {
    const { ir } = await build();
    const ev = ir.relationships.find((r) => r.id === 'web--api').evidence.find((e) => e.excerpt);
    ev.excerpt = 'otra cosa';
    const errors = validateAgainstRepository(ir, { commit: COMMIT, files: repo.files, directories: repo.directories });
    assert.ok(errors.some((e) => e.includes('extracto no coincide')));
  });
});

describe('sanitize', () => {
  test('redacta claves y conserva el nombre', () => {
    const out = sanitizeText('const apiKey = "abcdef123456"; const k = "sk-ant-abcdefghijklmnopqrstuvwxyz";');
    assert.equal(out.includes('abcdef123456'), false);
    assert.ok(out.includes('apiKey'));
    assert.deepEqual(findSecrets(out), []);
  });
  test('extractos acotados', () => {
    assert.ok(makeExcerpt('x'.repeat(500)).length <= 160);
  });
});

describe('artefactos publicados', () => {
  test('cada architecture.json del repo es válido', async () => {
    const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'projects');
    const { readdir } = await import('node:fs/promises');
    for (const slug of await readdir(dir)) {
      const project = JSON.parse(await readFile(path.join(dir, slug, 'project.json'), 'utf8'));
      if (!project.systemMap?.enabled) continue;
      const ir = JSON.parse(await readFile(path.join(dir, slug, project.systemMap.artifact), 'utf8'));
      assert.deepEqual(validateArchitecture(ir), [], slug);
      assert.equal(ir.source.commit, project.systemMap.commit, slug);
    }
  });
});
