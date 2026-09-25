// Carga de artefactos en build. Cada architecture.json se valida aquí: si
// uno es inválido, el build falla en vez de publicarlo. Solo corre en el
// servidor; al cliente llega únicamente el artefacto de la página abierta.

import { validateArchitecture } from '../../../system-map/lib/validate.mjs';
import type { Architecture } from './types';

type ProjectConfig = {
  slug: string;
  repository: string;
  branch: string;
  systemMap?: { enabled: boolean; artifact: string; generatedAt?: string; commit?: string };
};

const configs = import.meta.glob<ProjectConfig>('/system-map/projects/*/project.json', { eager: true, import: 'default' });
const artifacts = import.meta.glob<Architecture>('/system-map/projects/*/architecture.json', { eager: true, import: 'default' });

const slugFromPath = (p: string) => p.split('/').at(-2) ?? '';

function load(): Map<string, Architecture> {
  const maps = new Map<string, Architecture>();
  for (const [configPath, config] of Object.entries(configs)) {
    if (!config.systemMap?.enabled) continue;
    const slug = slugFromPath(configPath);
    const artifactPath = `/system-map/projects/${slug}/${config.systemMap.artifact}`;
    const ir = artifacts[artifactPath];
    if (!ir) throw new Error(`[system-map] ${slug}: falta ${artifactPath}. Ejecuta npm run system-map:generate.`);
    const errors = validateArchitecture(ir);
    if (ir.project.slug !== slug) errors.push(`project.slug "${ir.project.slug}" no coincide con la carpeta ${slug}`);
    if (errors.length) {
      throw new Error(`[system-map] ${slug}: architecture.json inválido, no se publica.\n  - ${errors.join('\n  - ')}`);
    }
    maps.set(slug, ir);
  }
  return maps;
}

const maps = load();

export const getSystemMap = (slug: string) => maps.get(slug);
export const hasSystemMap = (slug: string) => maps.has(slug);
export const systemMapSlugs = () => [...maps.keys()];
