// Obtención del checkout a analizar. Solo lectura y siempre superficial:
// el análisis necesita el árbol de un commit, no la historia.

import { execFile } from 'node:child_process';
import { mkdir, rm, stat } from 'node:fs/promises';
import { promisify } from 'node:util';

const run = promisify(execFile);

async function git(args, cwd) {
  const { stdout } = await run('git', args, { cwd, maxBuffer: 16 * 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });
  return stdout.trim();
}

const exists = (p) => stat(p).then(() => true, () => false);

/**
 * Deja en `dir` el árbol de `ref` (rama o SHA) de github.com/{repository}.
 * Reutiliza el directorio si ya es un clon del mismo repositorio.
 */
export async function checkout({ repository, ref, dir }) {
  const url = `https://github.com/${repository}.git`;
  if (!(await exists(`${dir}/.git`))) {
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });
    await git(['init', '--quiet'], dir);
    await git(['remote', 'add', 'origin', url], dir);
  }
  await git(['fetch', '--quiet', '--depth', '1', 'origin', ref], dir);
  await git(['checkout', '--quiet', '--force', '--detach', 'FETCH_HEAD'], dir);
  return describe(dir);
}

/** Commit y fecha del HEAD de un checkout existente. */
export async function describe(dir) {
  const commit = await git(['rev-parse', 'HEAD'], dir);
  const committedAt = await git(['log', '-1', '--format=%cI'], dir);
  return { commit, committedAt };
}
