#!/usr/bin/env node
// Convierte el volcado crudo de la tabla de hechos (CSV, fuera del repo) en el
// agregado anónimo que consume el sitio.
//
//   node scripts/build-electoral-dataset.mjs <ruta-al-csv>
//
// Regla del pipeline: el CSV nunca entra al repositorio. Trae nombres de autor
// y texto literal de personas identificables junto a una clasificación política
// inferida por un modelo; publicar eso sería publicar perfilamiento. Lo que se
// versiona es la salida de este script: conteos, cruces y un punto por
// comentario sin una sola cadena que apunte a una persona.

import { createHash, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT = resolve(import.meta.dirname, '../src/data/electoral.json');

// Campos que jamás se copian a la salida, ni siquiera transformados.
const PII = {
  author_display_name: '@«autor»',
  text_clean: '«texto del comentario»',
};

// El caso se cuenta por su método, no por sus protagonistas: los campos que
// nombran campaña y candidatos salen neutralizados. Poner esto en false
// devuelve los valores reales del CSV, que son públicos.
const ANONYMIZE_CAMPAIGN = true;
const CAMPAIGN = {
  video_title: '«entrevista pública al candidato de centro»',
  source_url: 'https://www.youtube.com/watch?v=«id»',
  candidate_reference: 'centro_indecisos',
};

// Vocabularios: el orden fija el índice con el que viajan los puntos.
const CODES = {
  segment: [
    'militante_duro', 'pro_candidato_a', 'pro_candidato_b', 'anti_candidato_a',
    'anti_candidato_b', 'anti_extremos', 'centro', 'indeciso', 'voto_blanco', 'no_clasificable',
  ],
  transfer: ['hacia_a', 'hacia_b', 'indefinido', 'voto_blanco', 'abstencion', 'no_aplica'],
  sentiment: ['positivo', 'negativo', 'neutral', 'mixto'],
  emotion: [
    'confianza', 'esperanza', 'rabia', 'frustracion', 'miedo',
    'incertidumbre', 'indiferencia', 'no_clasificable',
  ],
};

// --- CSV: comillas dobles, saltos de línea dentro de campo, "" como escape.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows.filter((r) => r.length > 1);
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
}

const count = (rows, key) => {
  const m = new Map();
  for (const r of rows) if (r[key]) m.set(r[key], (m.get(r[key]) ?? 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1]).map(([value, n]) => ({ value, n }));
};

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const round1 = (x) => Math.round(x * 10) / 10;

// El clasificador devolvió la intensidad en dos escalas distintas (0–1 y 0–100)
// según la corrida. Se normaliza a 0–100 y se reporta cuántas filas hubo que
// arreglar: ese número es el argumento para validar el contrato en el nodo.
function normalizeIntensity(rows) {
  let fixed = 0;
  for (const r of rows) {
    let touched = false;
    for (const f of ['sentiment_intensity', 'emotion_intensity']) {
      const v = Number(r[f]);
      if (!r[f] || Number.isNaN(v)) { r[f] = null; continue; }
      if (v > 0 && v <= 1) { r[f] = Math.round(v * 100); touched = true; } else r[f] = Math.round(v);
    }
    if (touched) fixed++;
  }
  return fixed;
}

function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error('uso: node scripts/build-electoral-dataset.mjs <ruta-al-csv>');
    process.exit(1);
  }

  const rows = parseCsv(readFileSync(csvPath, 'utf8'));
  const header = Object.keys(rows[0] ?? {});
  const valid = rows.filter((r) => r.is_valid_for_analysis === 'true');
  const analyzed = valid.filter((r) => r.model_name);
  const fixedIntensity = normalizeIntensity(analyzed);

  // Sal aleatoria por corrida: los hashes no sobreviven al proceso y solo se
  // usa su cardinalidad, así que no hay identificador estable que filtrar.
  const salt = randomBytes(16);
  const authors = new Set(
    rows.map((r) => createHash('sha256').update(salt).update(r.author_display_name ?? '').digest('hex').slice(0, 12)),
  );

  const mob = (r) => Number(r.mobility_score) || 0;
  const byKey = (key, pick) => {
    const m = new Map();
    for (const r of analyzed) {
      if (!r[key]) continue;
      if (!m.has(r[key])) m.set(r[key], []);
      m.get(r[key]).push(r);
    }
    return [...m].map(([value, rs]) => ({ value, n: rs.length, ...pick(rs) }));
  };

  const dataset = {
    // Trazabilidad del agregado, no del dato personal.
    source: {
      platform: 'youtube',
      videos: new Set(rows.map((r) => r.source_url)).size,
      batch: rows[0]?.collection_batch ?? null,
      from: rows.map((r) => r.published_at.slice(0, 10)).sort()[0],
      to: rows.map((r) => r.published_at.slice(0, 10)).sort().at(-1),
      model: analyzed[0]?.model_name ?? null,
      analyzedAt: analyzed.map((r) => r.analyzed_at.slice(0, 10)).sort()[0],
      fields: header.length,
    },
    totals: {
      captured: rows.length,
      valid: valid.length,
      discarded: rows.length - valid.length,
      analyzed: analyzed.length,
      authors: authors.size,
      likes: rows.reduce((a, r) => a + (Number(r.like_count) || 0), 0),
      replies: rows.reduce((a, r) => a + (Number(r.reply_count) || 0), 0),
      intensityNormalized: fixedIntensity,
    },
    quality: count(rows, 'quality_reason'),
    distributions: {
      sentiment: count(analyzed, 'sentiment'),
      emotion: count(analyzed, 'primary_emotion'),
      topic: count(analyzed, 'main_topic'),
      segment: count(analyzed, 'political_segment'),
      transfer: count(analyzed, 'transfer_signal'),
      cluster: count(rows, 'political_cluster'),
    },
    mobility: {
      mean: round1(mean(analyzed.map(mob))),
      immobile: analyzed.filter((r) => mob(r) === 0).length,
      movable: analyzed.filter((r) => mob(r) > 0).length,
      buckets: ['0', '1-25', '26-50', '51-75', '76-100'].map((label) => ({
        label,
        n: analyzed.filter((r) => {
          const s = mob(r);
          const [lo, hi] = label === '0' ? [0, 0] : label.split('-').map(Number);
          return s >= lo && s <= hi;
        }).length,
      })),
      bySegment: byKey('political_segment', (rs) => ({ mean: round1(mean(rs.map(mob))) }))
        .sort((a, b) => b.mean - a.mean),
      byEmotion: byKey('primary_emotion', (rs) => ({ mean: round1(mean(rs.map(mob))) }))
        .sort((a, b) => b.mean - a.mean),
    },
    // Los dos cruces que sostienen la tesis: quién se mueve y qué emoción empuja.
    transferBySegment: byKey('political_segment', (rs) => ({
      signals: Object.fromEntries(count(rs, 'transfer_signal').map((d) => [d.value, d.n])),
    })).sort((a, b) => b.n - a.n),
    transferByEmotion: byKey('primary_emotion', (rs) => ({
      mean: round1(mean(rs.map(mob))),
      signals: Object.fromEntries(count(rs, 'transfer_signal').map((d) => [d.value, d.n])),
    })).sort((a, b) => b.n - a.n),
    // Perfil del margen: en qué se diferencia el que no muestra destino del
    // que ya lo mostró. Es el cruce que sostiene el cuarto hallazgo.
    margin: (() => {
      const open = analyzed.filter((r) => r.transfer_signal === 'indefinido');
      const decided = analyzed.filter((r) => r.transfer_signal === 'hacia_a' || r.transfer_signal === 'hacia_b');
      const likes = (rs) => round1(mean(rs.map((r) => Number(r.like_count) || 0)) * 10) / 10;
      const profile = (rs) => ({
        n: rs.length,
        likes: Math.round(mean(rs.map((r) => Number(r.like_count) || 0)) * 100) / 100,
        words: Math.round(mean(rs.map((r) => Number(r.word_count) || 0))),
        emotion: count(rs, 'primary_emotion'),
        topic: count(rs, 'main_topic'),
        sentiment: count(rs, 'sentiment'),
      });
      return {
        open: profile(open),
        decided: profile(decided),
        segments: count(open, 'political_segment'),
        // Dentro del margen: la rabia se queda quieta, la frustración se mueve.
        immobile: profile(open.filter((r) => (Number(r.mobility_score) || 0) === 0)),
        mobile: profile(open.filter((r) => (Number(r.mobility_score) || 0) > 0)),
      };
    })(),
    codes: CODES,
    // Un punto por comentario para la animación: [válido, segmento, señal,
    // movilidad, sentimiento, emoción]. -1 = sin clasificar. Nada aquí
    // identifica a nadie; es la fila reducida a seis enteros.
    dots: rows.map((r) => [
      r.is_valid_for_analysis === 'true' ? 1 : 0,
      CODES.segment.indexOf(r.political_segment),
      CODES.transfer.indexOf(r.transfer_signal),
      Number(r.mobility_score) || 0,
      CODES.sentiment.indexOf(r.sentiment),
      CODES.emotion.indexOf(r.primary_emotion),
    ]),
    // Los 25 campos tal como salen del workflow. El ejemplo de cada campo se
    // toma de una fila real salvo en los dos que contienen datos personales.
    fields: header.map((name) => {
      const values = rows.map((r) => r[name]).filter(Boolean);
      const sample = analyzed.find((r) => r[name] !== '' && r[name] != null);
      return {
        name,
        filled: values.length,
        distinct: new Set(values).size,
        example:
          PII[name] ??
          (ANONYMIZE_CAMPAIGN ? CAMPAIGN[name] : null) ??
          String(sample?.[name] ?? '').slice(0, 64),
      };
    }),
  };

  writeFileSync(OUT, `${JSON.stringify(dataset, null, 2)}\n`);

  const leak = JSON.stringify(dataset).toLowerCase();
  for (const r of rows.slice(0, 50)) {
    const handle = (r.author_display_name ?? '').toLowerCase();
    if (handle.length > 4 && leak.includes(handle)) throw new Error(`fuga de autor: ${handle}`);
  }
  console.log(`✓ ${OUT}`);
  console.log(`  ${dataset.totals.captured} filas → ${dataset.totals.analyzed} analizadas · ${dataset.totals.authors} autores (solo conteo) · 0 campos con PII`);
}

main();
