// Validación del Architecture IR. Dos niveles:
//   validateArchitecture(ir)            → sin red ni checkout: esquema,
//                                         referencias, confianza, secretos,
//                                         enlaces fijados al commit. Corre en
//                                         cada build del portfolio.
//   validateAgainstRepository(ir, repo) → con el checkout del commit: cada
//                                         path existe, cada rango de líneas
//                                         existe y cada extracto coincide
//                                         con el código.
// Sin dependencias de Node: el portfolio la importa en build.

import {
  COMMIT_PATTERN,
  COMPONENT_TYPES,
  CONFIDENCE_LEVELS,
  CONFIDENCE_RANK,
  DECISION_BASIS,
  DIRECT_EVIDENCE_TYPES,
  EVIDENCE_TYPES,
  FLOW_KINDS,
  ID_PATTERN,
  LINES_PATTERN,
  MAX_ARTIFACT_BYTES,
  RELATIONSHIP_TYPES,
  REPOSITORY_PATTERN,
  SCHEMA_VERSION,
} from './constants.mjs';
import { confidenceFromEvidence, evidenceUrl } from './model.mjs';
import { findPrivateUrls, findSecrets, makeExcerpt } from './sanitize.mjs';

// Duplicado mínimo de scan.mjs para no arrastrar node:fs al navegador.
const SECRET_PATH = [/(^|\/)(secrets|credentials|\.ssh|\.aws)\//i, /(^|\/)\.env(\.[^/]*)?$/i, /\.(pem|key|p12|pfx|keystore|jks)$/i, /(^|\/)id_(rsa|dsa|ecdsa|ed25519)/i];

const isNonEmptyString = (v, max = 2000) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

export function validateArchitecture(ir) {
  const errors = [];
  const err = (where, msg) => errors.push(`${where}: ${msg}`);

  if (!ir || typeof ir !== 'object') return ['artifact: no es un objeto'];

  // --- Metadata y versionado.
  if (ir.schemaVersion !== SCHEMA_VERSION) err('schemaVersion', `se esperaba "${SCHEMA_VERSION}", llegó "${ir.schemaVersion}"`);
  for (const key of ['generatorVersion', 'analysisVersion']) if (!isNonEmptyString(ir[key], 80)) err(key, 'requerido');
  const generatedAt = Date.parse(ir.generatedAt);
  if (!isNonEmptyString(ir.generatedAt, 40) || Number.isNaN(generatedAt)) err('generatedAt', 'timestamp inválido');
  else if (generatedAt > Date.now() + 24 * 3600 * 1000) err('generatedAt', 'timestamp en el futuro');

  const project = ir.project ?? {};
  if (!ID_PATTERN.test(project.slug ?? '')) err('project.slug', 'inválido');
  if (!isNonEmptyString(project.name, 80)) err('project.name', 'requerido');
  if (!isNonEmptyString(project.summary, 200)) err('project.summary', 'requerido (≤200)');
  if (!Array.isArray(project.technologies)) err('project.technologies', 'debe ser lista');

  const source = ir.source ?? {};
  const repository = source.repository;
  const commit = source.commit;
  if (!REPOSITORY_PATTERN.test(repository ?? '')) err('source.repository', 'debe ser owner/repo');
  if (!COMMIT_PATTERN.test(commit ?? '')) err('source.commit', 'debe ser un SHA completo de 40 caracteres');
  if (source.url !== `https://github.com/${repository}`) err('source.url', 'no coincide con el repositorio');
  if (Number.isNaN(Date.parse(source.committedAt))) err('source.committedAt', 'timestamp inválido');

  // --- Evidencia.
  const checkEvidence = (list, where) => {
    if (!Array.isArray(list)) {
      err(where, 'evidence debe ser lista');
      return;
    }
    list.forEach((ev, i) => {
      const at = `${where}.evidence[${i}]`;
      if (!EVIDENCE_TYPES.includes(ev.type)) err(at, `tipo "${ev.type}" inválido`);
      if (!isNonEmptyString(ev.path, 300) || ev.path.startsWith('/') || ev.path.split('/').includes('..')) err(at, `path "${ev.path}" inválido`);
      if (SECRET_PATH.some((re) => re.test(ev.path ?? ''))) err(at, `path "${ev.path}" apunta a un archivo sensible`);
      if (ev.lines !== undefined) {
        const m = LINES_PATTERN.exec(ev.lines);
        if (!m || Number(m[1]) < 1 || (m[2] && Number(m[2]) < Number(m[1]))) err(at, `lines "${ev.lines}" inválido`);
        if (ev.dir) err(at, 'un directorio no tiene líneas');
      }
      if (commit && repository && ev.url !== evidenceUrl(repository, commit, ev)) err(at, 'url no está fijada al commit analizado');
    });
  };
  const checkConfidence = (el, where) => {
    if (!CONFIDENCE_LEVELS.includes(el.confidence)) {
      err(where, `confidence "${el.confidence}" inválida`);
      return;
    }
    // Nunca presentar como hecho lo que la evidencia no sostiene.
    const max = confidenceFromEvidence(el.evidence ?? []);
    if (CONFIDENCE_RANK[el.confidence] > CONFIDENCE_RANK[max]) err(where, `confidence "${el.confidence}" excede lo que sostiene su evidencia ("${max}")`);
  };

  // --- Grupos y componentes.
  const groups = new Set();
  if (!Array.isArray(ir.groups) || ir.groups.length === 0) err('groups', 'requerido');
  for (const g of ir.groups ?? []) {
    if (!ID_PATTERN.test(g.id ?? '') || groups.has(g.id)) err(`groups.${g.id}`, 'id inválido o duplicado');
    if (!isNonEmptyString(g.name, 40)) err(`groups.${g.id}`, 'name requerido');
    groups.add(g.id);
  }

  const components = new Map();
  if (!Array.isArray(ir.components) || ir.components.length === 0) err('components', 'requerido');
  for (const c of ir.components ?? []) {
    const where = `components.${c.id}`;
    if (!ID_PATTERN.test(c.id ?? '')) err(where, 'id inválido');
    if (components.has(c.id)) err(where, 'id duplicado');
    components.set(c.id, c);
    if (!isNonEmptyString(c.name, 60)) err(where, 'name inválido (1-60)');
    if (!COMPONENT_TYPES.includes(c.type)) err(where, `type "${c.type}" inválido`);
    if (!groups.has(c.group)) err(where, `group "${c.group}" no existe`);
    if (!isNonEmptyString(c.summary, 240)) err(where, 'summary requerido (≤240)');
    if (!Array.isArray(c.paths)) err(where, 'paths debe ser lista');
    checkEvidence(c.evidence, where);
    checkConfidence(c, where);
  }

  // --- Relaciones.
  const relationships = new Map();
  for (const r of ir.relationships ?? []) {
    const where = `relationships.${r.id}`;
    if (relationships.has(r.id)) err(where, 'id duplicado');
    relationships.set(r.id, r);
    if (r.id !== `${r.source}--${r.target}`) err(where, 'id debe ser source--target');
    if (!components.has(r.source)) err(where, `source "${r.source}" no existe`);
    if (!components.has(r.target)) err(where, `target "${r.target}" no existe`);
    if (r.source === r.target) err(where, 'source y target iguales');
    if (!RELATIONSHIP_TYPES.includes(r.type)) err(where, `type "${r.type}" inválido`);
    if (!isNonEmptyString(r.label, 120)) err(where, 'label requerido (≤120)');
    checkEvidence(r.evidence, where);
    checkConfidence(r, where);
    // Una relación confirmada debe citar código de alguno de sus extremos.
    if (r.confidence === 'confirmed') {
      const ends = [components.get(r.source), components.get(r.target)].filter(Boolean);
      const inEnds = (r.evidence ?? []).some(
        (ev) => DIRECT_EVIDENCE_TYPES.has(ev.type) && ends.some((c) => c.paths.some((p) => ev.path === p.replace(/\/$/, '') || ev.path.startsWith(p.replace(/\/?$/, '/')))),
      );
      if (!inEnds) err(where, 'confirmada sin evidencia directa en el código de sus extremos');
    }
  }

  // --- Flujos, decisiones, hallazgos.
  for (const f of ir.flows ?? []) {
    const where = `flows.${f.id}`;
    if (!ID_PATTERN.test(f.id ?? '')) err(where, 'id inválido');
    if (!FLOW_KINDS.includes(f.kind)) err(where, `kind "${f.kind}" inválido`);
    if (!isNonEmptyString(f.name, 80)) err(where, 'name requerido');
    if (!Array.isArray(f.steps) || f.steps.length < 2) err(where, 'al menos dos pasos');
    for (const s of f.steps ?? []) {
      const at = `${where}.${s.id}`;
      if (!isNonEmptyString(s.label, 80)) err(at, 'label requerido');
      if (s.component && !components.has(s.component)) err(at, `component "${s.component}" no existe`);
      if (s.relationship && !relationships.has(s.relationship)) err(at, `relationship "${s.relationship}" no existe`);
      checkEvidence(s.evidence, at);
      if (!CONFIDENCE_LEVELS.includes(s.confidence)) err(at, 'confidence inválida');
      // Heredar confianza de lo referenciado es válido; inventarla no.
      const ref = relationships.get(s.relationship) ?? components.get(s.component);
      const max = s.evidence?.length ? confidenceFromEvidence(s.evidence) : ref?.confidence ?? 'inferred';
      if (CONFIDENCE_RANK[s.confidence] > CONFIDENCE_RANK[max]) err(at, `confidence "${s.confidence}" excede "${max}"`);
    }
  }

  for (const d of ir.decisions ?? []) {
    const where = `decisions.${d.id}`;
    if (!ID_PATTERN.test(d.id ?? '')) err(where, 'id inválido');
    if (!isNonEmptyString(d.title, 120)) err(where, 'title requerido');
    if (!isNonEmptyString(d.why, 600)) err(where, 'why requerido (≤600)');
    if (!DECISION_BASIS.includes(d.basis)) err(where, `basis "${d.basis}" inválida`);
    for (const c of d.components ?? []) if (!components.has(c)) err(where, `component "${c}" no existe`);
    checkEvidence(d.evidence, where);
    checkConfidence(d, where);
    if (d.basis === 'observed' && !(d.evidence ?? []).some((e) => DIRECT_EVIDENCE_TYPES.has(e.type))) err(where, 'observed requiere evidencia directa');
    if (d.basis === 'documented' && !(d.evidence ?? []).some((e) => e.type === 'documentation')) err(where, 'documented requiere evidencia documental');
    if (d.basis === 'inferred' && CONFIDENCE_RANK[d.confidence] > CONFIDENCE_RANK.inferred) err(where, 'una inferencia no puede tener confianza mayor que inferred');
  }

  for (const f of ir.findings ?? []) {
    const where = `findings.${f.id}`;
    if (!['info', 'warning'].includes(f.severity)) err(where, 'severity inválida');
    if (!isNonEmptyString(f.title, 120)) err(where, 'title requerido');
    checkEvidence(f.evidence, where);
  }

  // --- Seguridad y tamaño.
  const serialized = JSON.stringify(ir);
  const secrets = findSecrets(serialized);
  if (secrets.length) err('artifact', `posibles secretos: ${secrets.join(', ')}`);
  const privateUrls = findPrivateUrls(serialized);
  if (privateUrls.length) err('artifact', `URLs privadas: ${privateUrls.slice(0, 3).join(', ')}`);
  const bytes = new TextEncoder().encode(serialized).length;
  if (bytes > MAX_ARTIFACT_BYTES) err('artifact', `${bytes} bytes excede ${MAX_ARTIFACT_BYTES}`);

  return errors;
}

/**
 * @param {object} ir
 * @param {{ commit: string, files: Map<string, string>, directories: Set<string> }} repo
 *   checkout del commit analizado (tras scanRepository).
 */
export function validateAgainstRepository(ir, repo) {
  const errors = [];
  if (repo.commit !== ir.source?.commit) errors.push(`source.commit: el checkout está en ${repo.commit}, el artefacto dice ${ir.source?.commit}`);

  const visit = (list, where) =>
    (list ?? []).forEach((ev, i) => {
      const at = `${where}.evidence[${i}] ${ev.path}`;
      if (ev.dir) {
        if (!repo.directories.has(ev.path)) errors.push(`${at}: directorio no existe`);
        return;
      }
      const text = repo.files.get(ev.path);
      if (text === undefined) {
        errors.push(`${at}: archivo no existe o está excluido del análisis`);
        return;
      }
      if (!ev.lines) return;
      const lines = text.split('\n');
      const [start, end = start] = ev.lines.split('-').map(Number);
      if (end > lines.length) errors.push(`${at}: líneas ${ev.lines} fuera de rango (${lines.length})`);
      else if (ev.excerpt && makeExcerpt(lines[start - 1]) !== ev.excerpt) errors.push(`${at}: el extracto no coincide con la línea ${start}`);
    });

  for (const c of ir.components ?? []) visit(c.evidence, `components.${c.id}`);
  for (const r of ir.relationships ?? []) visit(r.evidence, `relationships.${r.id}`);
  for (const f of ir.flows ?? []) for (const s of f.steps) visit(s.evidence, `flows.${f.id}.${s.id}`);
  for (const d of ir.decisions ?? []) visit(d.evidence, `decisions.${d.id}`);
  for (const f of ir.findings ?? []) {
    visit(f.evidence, `findings.${f.id}`);
    for (const p of f.absent ?? []) if (repo.files.has(p) || repo.directories.has(p)) errors.push(`findings.${f.id}: "${p}" existe en el commit`);
  }
  return errors;
}
