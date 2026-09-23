// Nada que salga del repositorio analizado llega al artefacto sin pasar por
// aquí. Dos defensas: redactar al construir extractos y, al validar, escanear
// el artefacto completo por si algo se coló.

import { MAX_EXCERPT_CHARS } from './constants.mjs';

const SECRET_PATTERNS = [
  { name: 'private-key', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'aws-access-key', re: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { name: 'github-token', re: /\b(gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/ },
  { name: 'openai-key', re: /\bsk-(proj-)?[A-Za-z0-9_-]{20,}\b/ },
  { name: 'anthropic-key', re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/ },
  { name: 'slack-token', re: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: 'google-api-key', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: 'stripe-key', re: /\b(sk|rk)_(live|test)_[0-9A-Za-z]{20,}\b/ },
  { name: 'jwt', re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  { name: 'telegram-bot-token', re: /\b\d{8,10}:[A-Za-z0-9_-]{35}\b/ },
  { name: 'url-credentials', re: /\b[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:[^\s/@]+@/i },
];

// URLs que no deben publicarse: redes privadas y hosts de desarrollo.
const PRIVATE_URL = /\bhttps?:\/\/(localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|[a-z0-9.-]+\.(internal|local|lan|corp))(:\d+)?[^\s"'`)]*/gi;

// `KEY = "valor"` / `token: 'valor'`: el nombre se conserva, el valor no.
const SENSITIVE_ASSIGNMENT = /\b([A-Za-z_]*(?:secret|token|password|passwd|api[_-]?key|private[_-]?key|credential)[A-Za-z_]*)(\s*[:=]\s*)(["'`])([^"'`]{6,})\3/gi;

export function findSecrets(text) {
  const hits = [];
  for (const { name, re } of SECRET_PATTERNS) {
    if (re.test(text)) hits.push(name);
  }
  return hits;
}

export function findPrivateUrls(text) {
  return [...text.matchAll(PRIVATE_URL)].map((m) => m[0]);
}

export function sanitizeText(text) {
  let out = text;
  for (const { re } of SECRET_PATTERNS) {
    out = out.replace(new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`), '[redacted]');
  }
  out = out.replace(PRIVATE_URL, '[private-url]');
  out = out.replace(SENSITIVE_ASSIGNMENT, (_m, key, sep, quote) => `${key}${sep}${quote}[redacted]${quote}`);
  return out;
}

/** Una línea de código lista para mostrarse junto a la evidencia. */
export function makeExcerpt(line) {
  const collapsed = sanitizeText(line.trim().replace(/\s+/g, ' '));
  return collapsed.length > MAX_EXCERPT_CHARS
    ? `${collapsed.slice(0, MAX_EXCERPT_CHARS - 1)}…`
    : collapsed;
}
