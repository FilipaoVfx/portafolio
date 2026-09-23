// Análisis estático: convierte archivos en hechos (facts) con ubicación
// exacta. Un hecho nunca interpreta: dice "en este archivo, en esta línea,
// hay un import / una ruta / una llamada HTTP". La interpretación viene
// después y solo puede citar hechos que existen.

import path from 'node:path';
import { makeExcerpt } from './sanitize.mjs';

const CODE_EXT = new Set(['.js', '.mjs', '.cjs', '.jsx', '.ts', '.mts', '.cts', '.tsx', '.astro', '.vue', '.svelte', '.html']);
const HTTP_METHODS = 'GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD';

const LANGUAGE_BY_EXT = {
  '.js': 'JavaScript', '.mjs': 'JavaScript', '.cjs': 'JavaScript', '.jsx': 'JavaScript',
  '.ts': 'TypeScript', '.mts': 'TypeScript', '.cts': 'TypeScript', '.tsx': 'TypeScript',
  '.astro': 'Astro', '.vue': 'Vue', '.svelte': 'Svelte', '.html': 'HTML',
  '.css': 'CSS', '.scss': 'CSS',
  '.sql': 'SQL', '.py': 'Python', '.go': 'Go', '.rs': 'Rust',
  '.sh': 'Shell', '.ps1': 'PowerShell',
  '.md': 'Markdown', '.json': 'JSON', '.yml': 'YAML', '.yaml': 'YAML', '.toml': 'TOML',
};

export const isCodeFile = (file) => CODE_EXT.has(path.posix.extname(file).toLowerCase());

function lineAt(text, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) if (text.charCodeAt(i) === 10) line += 1;
  return line;
}

// Índices de inicio de línea: lineAt O(log n) para archivos grandes.
function lineIndex(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i += 1) if (text.charCodeAt(i) === 10) starts.push(i + 1);
  return (index) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= index) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
}

const isCommentLine = (line) => /^\s*(\/\/|\*|\/\*|#|<!--)/.test(line);

function resolveModule(fromFile, specifier, files) {
  if (!specifier.startsWith('.') && !specifier.startsWith('/')) return null;
  const base = specifier.startsWith('/')
    ? specifier.slice(1)
    : path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), specifier));
  const candidates = [
    base,
    ...['.js', '.mjs', '.ts', '.tsx', '.jsx', '.astro'].map((ext) => `${base}${ext}`),
    ...['index.js', 'index.ts', 'index.tsx', 'index.mjs'].map((f) => `${base}/${f}`),
  ];
  // `./x.js` escrito desde TS puede apuntar a `x.ts`.
  if (/\.js$/.test(base)) candidates.push(base.replace(/\.js$/, '.ts'), base.replace(/\.js$/, '.tsx'));
  return candidates.find((c) => files.has(c)) ?? null;
}

// Nombre de paquete sin subruta: `@scope/pkg/x` → `@scope/pkg`, `pkg/x` → `pkg`.
export function packageName(specifier) {
  if (specifier.startsWith('node:')) return specifier;
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

function extractImports(file, text, files, locate) {
  const facts = [];
  const lines = text.split('\n');
  const patterns = [
    /(?:^|[\n;])\s*(?:import|export)\s+(?:type\s+)?(?:[^'"`;]*?\s+from\s+)?(["'])([^"'\n]+)\1/g,
    /\bimport\(\s*(["'])([^"'\n]+)\1\s*\)/g,
    /\brequire\(\s*(["'])([^"'\n]+)\1\s*\)/g,
  ];
  const seen = new Set();
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      const specifier = m[2];
      const specIndex = m.index + m[0].lastIndexOf(specifier);
      const line = locate(specIndex);
      const key = `${line}:${specifier}`;
      if (seen.has(key)) continue;
      seen.add(key);
      facts.push({
        kind: 'import',
        file,
        line,
        specifier,
        package: specifier.startsWith('.') || specifier.startsWith('/') ? null : packageName(specifier),
        resolved: resolveModule(file, specifier, files),
        excerpt: makeExcerpt(lines[line - 1] ?? ''),
      });
    }
  }
  return facts;
}

// `/^\/api\/x\/[^/]+$/` → `/api/x/:param`
function regexToRoute(source) {
  return source
    .replace(/^\^/, '')
    .replace(/\$$/, '')
    .replace(/\\\//g, '/')
    .replace(/\[\^\/\]\+|\.\+|\.\*|\([^)]*\)/g, ':param');
}

function extractRoutes(file, text) {
  const facts = [];
  const lines = text.split('\n');
  const methodEq = new RegExp(`method\\s*===\\s*["'](${HTTP_METHODS})["']`);
  const pathEq = /\b(?:routePath|pathname|path|url\.pathname)\s*===\s*["'](\/[^"']*)["']/g;
  const regexTest = /\/(\^\\\/(?:\\\/|[^/\n])+)\/[a-z]*\.test\(\s*(?:routePath|pathname|path|url\.pathname)\s*\)/g;
  const express = new RegExp(`\\b(?:app|router|server|api|hono|r)\\.(get|post|put|patch|delete|all)\\(\\s*["'\`](\\/[^"'\`]*)["'\`]`, 'gi');

  lines.forEach((raw, i) => {
    if (isCommentLine(raw)) return;
    const line = i + 1;
    const method = raw.match(methodEq)?.[1] ?? null;
    for (const m of raw.matchAll(pathEq)) {
      facts.push({ kind: 'route', file, line, method, path: m[1], excerpt: makeExcerpt(raw) });
    }
    for (const m of raw.matchAll(regexTest)) {
      facts.push({ kind: 'route', file, line, method, path: regexToRoute(m[1]), excerpt: makeExcerpt(raw) });
    }
    for (const m of raw.matchAll(express)) {
      facts.push({ kind: 'route', file, line, method: m[1].toUpperCase(), path: m[2], excerpt: makeExcerpt(raw) });
    }
  });

  // Rango del handler: desde la ruta hasta justo antes de la siguiente
  // (acotado), para que la evidencia enlace el bloque completo.
  const withMethod = facts.filter((f) => f.method);
  withMethod.sort((a, b) => a.line - b.line);
  withMethod.forEach((fact, i) => {
    const next = withMethod[i + 1]?.line ?? lines.length + 1;
    let end = Math.min(next - 1, fact.line + 60);
    while (end > fact.line && lines[end - 1].trim() === '') end -= 1;
    fact.endLine = end;
  });
  return facts;
}

// Rutas por archivo en frameworks con file-based routing (Astro, Next).
function extractPageRoute(file) {
  const m = file.match(/(?:^|\/)(?:src\/)?pages\/(.+)\.(astro|tsx|jsx|ts|js|md|mdx)$/);
  if (!m) return [];
  let route = `/${m[1]}`.replace(/\/index$/, '/').replace(/\[([^\]]+)\]/g, ':$1');
  if (route === '') route = '/';
  return [{ kind: 'page', file, line: 1, path: route, excerpt: '' }];
}

const CALL_CONTEXT = /fetch\(|axios|\bcurl\b|request\(|buildBackendUrl|\bapi\(|endpoint|new URL\(|_BASE|BASE_URL|baseUrl|apiBase/i;

function extractCalls(file, text) {
  const facts = [];
  const lines = text.split('\n');
  lines.forEach((raw, i) => {
    if (isCommentLine(raw)) return;
    const line = i + 1;
    // `fetch(` suele ir en la línea anterior cuando la URL es un template largo.
    const inCallContext = CALL_CONTEXT.test(raw) || /fetch\(\s*$|axios\.\w+\(\s*$/.test(lines[i - 1] ?? '');
    for (const m of raw.matchAll(/\bhttps?:\/\/([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)(?::\d+)?/g)) {
      facts.push({ kind: 'host', file, line, host: m[1].toLowerCase(), call: inCallContext, excerpt: makeExcerpt(raw) });
    }
    if (!inCallContext) return;
    const seen = new Set();
    const pathPatterns = [
      /\$\{[^}]+\}(\/[A-Za-z0-9_\-/.:]*[A-Za-z0-9_\-])/g, // `${API_BASE}/search/goal`
      /["'`](\/(?:[A-Za-z0-9_\-.:]+\/?)+)["'`]/g, // "/api/bookmarks/batch"
    ];
    for (const re of pathPatterns) {
      for (const m of raw.matchAll(re)) {
        const p = m[1].replace(/\/+$/, '') || '/';
        if (seen.has(p) || /\.(js|css|png|svg|html|json)$/.test(p)) continue;
        seen.add(p);
        facts.push({ kind: 'call', file, line, path: p, excerpt: makeExcerpt(raw) });
      }
    }
  });
  return facts;
}

function extractDataAccess(file, text) {
  const facts = [];
  text.split('\n').forEach((raw, i) => {
    if (isCommentLine(raw)) return;
    const line = i + 1;
    for (const m of raw.matchAll(/(\bstorage)?\.from\(\s*["'`]([A-Za-z_][A-Za-z0-9_]*)["'`]\s*\)/g)) {
      facts.push({ kind: m[1] ? 'bucket' : 'table', file, line, name: m[2], excerpt: makeExcerpt(raw) });
    }
    for (const m of raw.matchAll(/\.rpc\(\s*["'`]([A-Za-z_][A-Za-z0-9_]*)["'`]/g)) {
      facts.push({ kind: 'rpc', file, line, name: m[1], excerpt: makeExcerpt(raw) });
    }
  });
  // `rpc(\n  "search_goal_v3",` — nombre en la línea siguiente.
  for (const m of text.matchAll(/\.rpc\(\s*\n\s*["'`]([A-Za-z_][A-Za-z0-9_]*)["'`]/g)) {
    const line = lineAt(text, m.index + m[0].indexOf(m[1]));
    if (!facts.some((f) => f.kind === 'rpc' && f.line === line)) {
      facts.push({ kind: 'rpc', file, line, name: m[1], excerpt: makeExcerpt(text.split('\n')[line - 1]) });
    }
  }
  return facts;
}

function extractEnv(file, text) {
  const facts = [];
  const seen = new Set();
  const patterns = [
    /process\.env\.([A-Z_][A-Z0-9_]*)/g,
    /process\.env\[\s*["']([A-Z_][A-Z0-9_]*)["']\s*\]/g,
    /import\.meta\.env\.([A-Z_][A-Z0-9_]*)/g,
    /Deno\.env\.get\(\s*["']([A-Z_][A-Z0-9_]*)["']/g,
    /os\.environ(?:\.get\(|\[)\s*["']([A-Z_][A-Z0-9_]*)["']/g,
    /\$\{\{\s*secrets\.([A-Z_][A-Z0-9_]*)\s*\}\}/g,
  ];
  text.split('\n').forEach((raw, i) => {
    for (const re of patterns) {
      for (const m of raw.matchAll(re)) {
        if (seen.has(m[1])) continue;
        seen.add(m[1]);
        // Solo el nombre: el valor nunca se lee ni se publica.
        facts.push({ kind: 'env', file, line: i + 1, name: m[1], secret: re.source.includes('secrets'), excerpt: makeExcerpt(raw) });
      }
    }
  });
  return facts;
}

function findJsonKeyLine(lines, key, afterLine = 0) {
  const needle = `"${key}"`;
  for (let i = afterLine; i < lines.length; i += 1) if (lines[i].includes(needle)) return i + 1;
  return null;
}

function extractManifest(file, text) {
  const facts = [];
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return facts;
  }
  const lines = text.split('\n');
  if (path.posix.basename(file) === 'package.json') {
    for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
      const sectionLine = findJsonKeyLine(lines, section) ?? 0;
      for (const [name, version] of Object.entries(json[section] ?? {})) {
        const line = findJsonKeyLine(lines, name, sectionLine) ?? sectionLine;
        facts.push({ kind: 'dependency', file, line, name, version: String(version), dev: section !== 'dependencies', excerpt: makeExcerpt(lines[line - 1] ?? '') });
      }
    }
    const scriptsLine = findJsonKeyLine(lines, 'scripts') ?? 0;
    for (const [name, command] of Object.entries(json.scripts ?? {})) {
      const line = findJsonKeyLine(lines, name, scriptsLine) ?? scriptsLine;
      facts.push({ kind: 'script', file, line, name, command: String(command), excerpt: makeExcerpt(lines[line - 1] ?? '') });
    }
    const workspaces = Array.isArray(json.workspaces) ? json.workspaces : json.workspaces?.packages;
    if (Array.isArray(workspaces)) {
      const line = findJsonKeyLine(lines, 'workspaces') ?? 1;
      facts.push({ kind: 'workspaces', file, line, packages: workspaces, excerpt: makeExcerpt(lines[line - 1] ?? '') });
    }
    if (json.name) facts.push({ kind: 'package', file, line: findJsonKeyLine(lines, 'name') ?? 1, name: json.name, excerpt: '' });
  }
  if (json.manifest_version) {
    facts.push({ kind: 'extension-manifest', file, line: findJsonKeyLine(lines, 'manifest_version') ?? 1, version: json.manifest_version, excerpt: makeExcerpt(lines[(findJsonKeyLine(lines, 'manifest_version') ?? 1) - 1]) });
  }
  return facts;
}

function extractSql(file, text) {
  const facts = [];
  const re = /\bcreate\s+(?:or\s+replace\s+)?(?:unique\s+)?(table|function|extension|view|materialized\s+view|index|trigger|type)\s+(?:concurrently\s+)?(?:if\s+not\s+exists\s+)?(?:"?public"?\.)?"?([A-Za-z_][A-Za-z0-9_]*)"?/gi;
  const locate = lineIndex(text);
  const lines = text.split('\n');
  for (const m of text.matchAll(re)) {
    const line = locate(m.index);
    facts.push({ kind: 'sql-object', file, line, objectType: m[1].toLowerCase().replace(/\s+/g, ' '), name: m[2].toLowerCase(), excerpt: makeExcerpt(lines[line - 1]) });
  }
  return facts;
}

function extractDocker(file, text) {
  const facts = [];
  text.split('\n').forEach((raw, i) => {
    const m = raw.match(/^\s*(FROM|EXPOSE|CMD|ENTRYPOINT|COPY|WORKDIR)\s+(.+)$/i);
    if (m) facts.push({ kind: 'docker', file, line: i + 1, instruction: m[1].toUpperCase(), value: m[2].trim(), excerpt: makeExcerpt(raw) });
  });
  return facts;
}

function extractCompose(file, text) {
  const facts = [];
  const lines = text.split('\n');
  let inServices = false;
  let current = null;
  lines.forEach((raw, i) => {
    if (/^services:\s*$/.test(raw)) {
      inServices = true;
      return;
    }
    if (/^\S/.test(raw)) inServices = false;
    if (!inServices) return;
    const svc = raw.match(/^ {2}([A-Za-z0-9_.-]+):\s*$/);
    if (svc) {
      current = { kind: 'compose-service', file, line: i + 1, name: svc[1], image: null, excerpt: makeExcerpt(raw) };
      facts.push(current);
      return;
    }
    const image = raw.match(/^\s+image:\s*(\S+)/);
    if (image && current) current.image = image[1];
  });
  return facts;
}

function extractWorkflow(file, text, files) {
  const facts = [];
  const lines = text.split('\n');
  const name = text.match(/^name:\s*(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '') ?? path.posix.basename(file);
  const crons = [...text.matchAll(/cron:\s*["']([^"']+)["']/g)].map((m) => m[1]);
  facts.push({ kind: 'workflow', file, line: 1, name, schedules: crons, excerpt: makeExcerpt(lines[0]) });
  let workingDirectory = '';
  lines.forEach((raw, i) => {
    const wd = raw.match(/working-directory:\s*(\S+)/);
    if (wd) workingDirectory = wd[1].replace(/^\.\//, '').replace(/\/$/, '');
    const run = raw.match(/^\s*(?:-\s*)?run:\s*(.+)$/);
    if (run && run[1].trim() !== '|') {
      // Scripts del repo que el workflow ejecuta: `node backend/src/x.js`.
      const targets = [...run[1].matchAll(/([\w./-]+\.(?:m?js|ts|py|sh))\b/g)]
        .map((m) => [m[1], workingDirectory ? `${workingDirectory}/${m[1]}` : null])
        .map(([a, b]) => (files.has(a) ? a : b && files.has(b) ? b : null))
        .filter(Boolean);
      facts.push({ kind: 'workflow-run', file, line: i + 1, command: run[1].trim(), targets, excerpt: makeExcerpt(raw) });
    }
    const uses = raw.match(/^\s*(?:-\s*)?uses:\s*(\S+)/);
    if (uses) facts.push({ kind: 'workflow-uses', file, line: i + 1, action: uses[1], excerpt: makeExcerpt(raw) });
  });
  return facts;
}

function extractHeadings(file, text) {
  const facts = [];
  const lines = text.split('\n');
  let inFence = false;
  lines.forEach((raw, i) => {
    if (/^\s*```/.test(raw)) inFence = !inFence;
    if (inFence) return;
    const m = raw.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (m) facts.push({ kind: 'heading', file, line: i + 1, level: m[1].length, title: m[2], excerpt: makeExcerpt(raw) });
  });
  facts.forEach((fact, i) => {
    const next = facts.slice(i + 1).find((f) => f.level <= fact.level);
    let end = (next?.line ?? lines.length + 1) - 1;
    while (end > fact.line && lines[end - 1].trim() === '') end -= 1;
    fact.endLine = end;
  });
  return facts;
}

/**
 * @param {Map<string, string>} files
 * @returns {{ facts: object[], languages: Record<string, { files: number, lines: number }> }}
 */
export function extractFacts(files) {
  const facts = [];
  const languages = {};
  for (const [file, text] of files) {
    const ext = path.posix.extname(file).toLowerCase();
    const base = path.posix.basename(file);
    const lang = LANGUAGE_BY_EXT[ext];
    if (lang) {
      languages[lang] ??= { files: 0, lines: 0 };
      languages[lang].files += 1;
      languages[lang].lines += text.split('\n').length;
    }

    if (isCodeFile(file)) {
      const locate = lineIndex(text);
      facts.push(
        ...extractImports(file, text, files, locate),
        ...extractRoutes(file, text),
        ...extractCalls(file, text),
        ...extractDataAccess(file, text),
        ...extractEnv(file, text),
        ...extractPageRoute(file),
      );
    }
    if (ext === '.json') facts.push(...extractManifest(file, text));
    if (ext === '.sql') facts.push(...extractSql(file, text));
    if (/^Dockerfile(\..+)?$/i.test(base) || ext === '.dockerfile') facts.push(...extractDocker(file, text));
    if (/^(docker-)?compose(\.[\w-]+)?\.ya?ml$/i.test(base)) facts.push(...extractCompose(file, text));
    const isWorkflow = /^\.github\/workflows\/.+\.ya?ml$/.test(file) || base === '.gitlab-ci.yml';
    if (isWorkflow) facts.push(...extractWorkflow(file, text, files), ...extractEnv(file, text), ...extractCalls(file, text));
    else if (ext === '.yml' || ext === '.yaml' || ext === '.toml') facts.push(...extractCalls(file, text).filter((f) => f.kind === 'host'));
    if (ext === '.md' || ext === '.mdx') facts.push(...extractHeadings(file, text));
  }
  return { facts, languages };
}
