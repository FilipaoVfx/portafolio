// Recorre el checkout y decide qué entra al análisis. La exclusión es
// explícita y conservadora: ante la duda (binario, gigante, posible secreto)
// el archivo no se lee.

import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'out',
  '.astro',
  '.next',
  '.nuxt',
  '.svelte-kit',
  '.turbo',
  '.cache',
  '.parcel-cache',
  '.vercel',
  '.wrangler',
  'coverage',
  '__pycache__',
  '.venv',
  'venv',
  'vendor',
]);

// Nunca se leen ni se citan como evidencia (PRD §25).
const SECRET_DIRS = new Set(['secrets', 'credentials', '.ssh', '.aws', '.gnupg']);
const SECRET_FILE_PATTERNS = [
  /^\.env(\..*)?$/i,
  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /\.keystore$/i,
  /\.jks$/i,
  /^id_(rsa|dsa|ecdsa|ed25519)(\.pub)?$/i,
  /^\.npmrc$/i,
  /^\.netrc$/i,
  /credentials?\.json$/i,
  /^service-account.*\.json$/i,
];

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico', '.bmp', '.tiff',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.mp3', '.mp4', '.mov', '.webm', '.wav', '.ogg',
  '.zip', '.gz', '.tgz', '.rar', '.7z', '.tar',
  '.pdf', '.psd', '.ai', '.sketch', '.fig',
  '.glb', '.gltf', '.fbx', '.obj', '.blend',
  '.exe', '.dll', '.so', '.dylib', '.wasm', '.bin',
  '.sqlite', '.db',
]);

// Lockfiles y dumps: enormes y sin información arquitectónica que no esté
// ya en el manifest.
const IRRELEVANT_FILES = new Set(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb']);

export const MAX_FILE_BYTES = 512 * 1024;

export function isSecretPath(relPath) {
  const parts = relPath.split('/');
  if (parts.slice(0, -1).some((p) => SECRET_DIRS.has(p.toLowerCase()))) return true;
  const base = parts[parts.length - 1];
  return SECRET_FILE_PATTERNS.some((re) => re.test(base));
}

function classifyExclusion(relPath, size) {
  const base = path.posix.basename(relPath);
  if (isSecretPath(relPath)) return 'secret';
  if (BINARY_EXTENSIONS.has(path.posix.extname(base).toLowerCase())) return 'binary';
  if (IRRELEVANT_FILES.has(base)) return 'lockfile';
  if (size > MAX_FILE_BYTES) return 'too-large';
  return null;
}

/**
 * @returns {Promise<{ files: Map<string, string>, directories: Set<string>, excluded: Record<string, number> }>}
 *   files: ruta relativa (posix) → contenido de texto, solo archivos admitidos.
 */
export async function scanRepository(root) {
  const files = new Map();
  const directories = new Set();
  const excluded = { secret: 0, binary: 0, lockfile: 0, 'too-large': 0, 'ignored-dir': 0 };

  async function walk(dir, rel) {
    const entries = await readdir(dir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      const abs = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) {
          excluded['ignored-dir'] += 1;
          continue;
        }
        if (SECRET_DIRS.has(entry.name.toLowerCase())) {
          excluded.secret += 1;
          continue;
        }
        directories.add(relPath);
        await walk(abs, relPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const { size } = await stat(abs);
      const reason = classifyExclusion(relPath, size);
      if (reason) {
        excluded[reason] += 1;
        continue;
      }
      const buffer = await readFile(abs);
      // Byte nulo en los primeros 8 KB: binario aunque la extensión no lo diga.
      if (buffer.subarray(0, 8192).includes(0)) {
        excluded.binary += 1;
        continue;
      }
      files.set(relPath, buffer.toString('utf8'));
    }
  }

  await walk(root, '');
  return { files, directories, excluded };
}
