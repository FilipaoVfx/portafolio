#!/usr/bin/env node
// System Map — pipeline de generación y validación.
//
//   node system-map/cli.mjs generate [slug...] [--repo-dir <path>] [--strict]
//       Repositorio → análisis estático → IR → validación → architecture.json.
//       Si algo falla, avisa y conserva el último artefacto válido (exit 0);
//       con --strict, falla (exit 1).
//
//   node system-map/cli.mjs validate [slug...] [--deep] [--repo-dir <path>]
//       Valida los artefactos publicados. --deep descarga el commit
//       analizado y comprueba cada path, rango de líneas y extracto.
//
//   node system-map/cli.mjs facts <slug> [--kind route] [--repo-dir <path>]
//       Vuelca los hechos estáticos (ayuda para redactar la interpretación).

import { existsSync } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractFacts } from './lib/extract.mjs';
import { checkout, describe } from './lib/git.mjs';
import { interpret } from './lib/interpret.mjs';
import { scanRepository } from './lib/scan.mjs';
import { validateAgainstRepository, validateArchitecture } from './lib/validate.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS_DIR = path.join(ROOT, 'projects');
const CACHE_DIR = path.resolve(ROOT, '..', '.cache', 'system-map');

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const writeJson = (file, data) => writeFile(file, `${JSON.stringify(data, null, 2)}\n`);

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const flags = {};
  const positional = [];
  for (let i = 0; i < rest.length; i += 1) {
    const a = rest[i];
    if (!a.startsWith('--')) positional.push(a);
    else if (['--strict', '--deep'].includes(a)) flags[a.slice(2)] = true;
    else flags[a.slice(2)] = rest[++i];
  }
  return { command, flags, positional };
}

async function listProjects(slugs) {
  const all = (await readdir(PROJECTS_DIR, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  const unknown = slugs.filter((s) => !all.includes(s));
  if (unknown.length) throw new Error(`proyectos desconocidos: ${unknown.join(', ')}`);
  return slugs.length ? slugs : all;
}

async function loadProject(slug) {
  const dir = path.join(PROJECTS_DIR, slug);
  const project = await readJson(path.join(dir, 'project.json'));
  if (project.slug !== slug) throw new Error(`${slug}/project.json: slug "${project.slug}" no coincide con la carpeta`);
  return { dir, project };
}

async function prepareRepo(project, { repoDir, ref }) {
  if (repoDir) return { dir: path.resolve(repoDir), ...(await describe(path.resolve(repoDir))) };
  const dir = path.join(CACHE_DIR, project.slug);
  return { dir, ...(await checkout({ repository: project.repository, ref, dir })) };
}

async function analyze(project, interpretation, repo) {
  const { files, directories, excluded } = await scanRepository(repo.dir);
  const { facts, languages } = extractFacts(files);
  const result = interpret({
    project,
    interpretation,
    facts,
    files,
    directories,
    excluded,
    languages,
    commit: repo.commit,
    committedAt: repo.committedAt,
    generatedAt: new Date().toISOString(),
  });
  return { ...result, files, directories, facts };
}

const withoutTimestamp = (ir) => JSON.stringify({ ...ir, generatedAt: null });

async function generate(slug, flags) {
  const { dir, project } = await loadProject(slug);
  if (!project.systemMap?.enabled) {
    console.log(`· ${slug}: systemMap deshabilitado, se omite`);
    return true;
  }
  const artifactPath = path.join(dir, project.systemMap.artifact);
  const interpretation = await readJson(path.join(dir, 'interpretation.json'));

  const repo = await prepareRepo(project, { repoDir: flags['repo-dir'], ref: project.branch });
  console.log(`· ${slug}: analizando ${project.repository}@${repo.commit.slice(0, 7)}`);
  const { ir, errors, warnings, files, directories } = await analyze(project, interpretation, repo);

  for (const w of warnings) console.warn(`  ! ${w}`);
  errors.push(...validateArchitecture(ir), ...validateAgainstRepository(ir, { commit: repo.commit, files, directories }));
  if (errors.length) {
    console.error(`✗ ${slug}: ${errors.length} error(es); se conserva el artefacto anterior`);
    for (const e of errors) console.error(`  - ${e}`);
    return false;
  }

  // Sin cambios reales (mismo commit, misma interpretación): no reescribir
  // solo porque cambió la hora de generación.
  if (existsSync(artifactPath)) {
    const previous = await readJson(artifactPath);
    if (withoutTimestamp(previous) === withoutTimestamp(ir)) {
      console.log(`✓ ${slug}: sin cambios (${ir.components.length} componentes, ${ir.relationships.length} relaciones)`);
      return true;
    }
  }
  await writeJson(artifactPath, ir);
  project.systemMap = { ...project.systemMap, generatedAt: ir.generatedAt, commit: ir.source.commit };
  await writeJson(path.join(dir, 'project.json'), project);
  const bytes = Buffer.byteLength(JSON.stringify(ir));
  console.log(`✓ ${slug}: ${ir.components.length} componentes, ${ir.relationships.length} relaciones, ${ir.flows.length} flujos, ${ir.decisions.length} decisiones · ${(bytes / 1024).toFixed(1)} KB`);
  return true;
}

async function validate(slug, flags) {
  const { dir, project } = await loadProject(slug);
  if (!project.systemMap?.enabled) return true;
  const ir = await readJson(path.join(dir, project.systemMap.artifact));
  const errors = validateArchitecture(ir);
  if (ir.project?.slug !== slug) errors.push(`project.slug "${ir.project?.slug}" no coincide con ${slug}`);
  if (project.systemMap.commit && project.systemMap.commit !== ir.source?.commit) errors.push('project.json y architecture.json apuntan a commits distintos');
  if (flags.deep && errors.length === 0) {
    const repo = await prepareRepo(project, { repoDir: flags['repo-dir'], ref: ir.source.commit });
    const { files, directories } = await scanRepository(repo.dir);
    errors.push(...validateAgainstRepository(ir, { commit: repo.commit, files, directories }));
  }
  if (errors.length) {
    console.error(`✗ ${slug}: artefacto inválido`);
    for (const e of errors) console.error(`  - ${e}`);
    return false;
  }
  console.log(`✓ ${slug}: artefacto válido${flags.deep ? ' (contrastado con el repositorio)' : ''} · ${ir.source.commit.slice(0, 7)}`);
  return true;
}

async function dumpFacts(slug, flags) {
  const { project } = await loadProject(slug);
  const repo = await prepareRepo(project, { repoDir: flags['repo-dir'], ref: project.branch });
  const { files } = await scanRepository(repo.dir);
  const { facts } = extractFacts(files);
  for (const f of facts.filter((x) => !flags.kind || x.kind === flags.kind)) console.log(JSON.stringify(f));
  return true;
}

async function main() {
  const { command, flags, positional } = parseArgs(process.argv.slice(2));
  const commands = { generate, validate, facts: dumpFacts };
  if (!commands[command]) {
    console.error('uso: cli.mjs <generate|validate|facts> [slug...] [--repo-dir path] [--strict] [--deep] [--kind k]');
    process.exit(2);
  }
  const slugs = await listProjects(positional);
  let ok = true;
  for (const slug of slugs) {
    try {
      ok = (await commands[command](slug, flags)) && ok;
    } catch (error) {
      console.error(`✗ ${slug}: ${error.message}`);
      ok = false;
    }
  }
  // generate sin --strict: el deploy sigue con el último artefacto válido.
  if (!ok && (command !== 'generate' || flags.strict)) process.exit(1);
  if (!ok) console.warn('! análisis con errores: se publican los últimos artefactos válidos');
}

await main();
