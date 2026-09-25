// Reglas del modelo que comparten el generador, el validador y el portfolio.
// Sin dependencias de Node: se ejecuta igual en build que en el navegador.

import { CONFIDENCE_RANK, DIRECT_EVIDENCE_TYPES } from './constants.mjs';

/** Enlace a GitHub fijado al commit analizado, nunca a una rama. */
export function evidenceUrl(repository, commit, ev) {
  const base = `https://github.com/${repository}`;
  if (ev.dir) return `${base}/tree/${commit}/${ev.path}`;
  const anchor = ev.lines ? `#L${ev.lines.replace('-', '-L')}` : '';
  return `${base}/blob/${commit}/${ev.path}${anchor}`;
}

/** Confianza que la evidencia sostiene por sí sola. */
export function confidenceFromEvidence(evidence) {
  if (evidence.some((e) => DIRECT_EVIDENCE_TYPES.has(e.type))) return 'confirmed';
  if (evidence.length > 0) return 'supported';
  return 'inferred';
}

/** La interpretación puede bajar la confianza, nunca subirla. */
export function applyCap(computed, cap) {
  if (!cap) return computed;
  return CONFIDENCE_RANK[cap] < CONFIDENCE_RANK[computed] ? cap : computed;
}
