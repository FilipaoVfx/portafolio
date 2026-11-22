// Geometría de la animación de votantes, sin Remotion.
//
// Cada punto es un comentario real del corpus, reducido a seis enteros en
// electoral.json. Este módulo decide dónde cae ese punto en cada acto y de qué
// color se pinta. Lo importa tanto la composición animada como el tablero
// estático, así el último fotograma y el fallback son la misma imagen.

import { electoral } from '@/data/electoral';

export const W = 1280;
export const H = 720;

const C = electoral.codes;
const i = (list: readonly string[], v: string) => list.indexOf(v);

export const COLOR = {
  lime: '#c6ff3d',
  electric: '#3df0ff',
  magenta: '#ff3dd1',
  amber: '#ffb13d',
  dim: 'rgba(255,255,255,0.16)',
  faint: 'rgba(255,255,255,0.08)',
  plain: 'rgba(255,255,255,0.55)',
} as const;

export type Dot = {
  valid: boolean;
  seg: number;
  tr: number;
  mob: number;
  /** Posición y estilo en cada acto. */
  at: { x: number; y: number; r: number; fill: string }[];
};

type Slot = { x: number; y: number };

// Rejilla centrada en (cx, cy): n puntos en filas de `cols`.
function grid(n: number, cols: number, cx: number, cy: number, step: number): Slot[] {
  const rows = Math.ceil(n / cols);
  const x0 = cx - ((cols - 1) * step) / 2;
  const y0 = cy - ((rows - 1) * step) / 2;
  return Array.from({ length: n }, (_, k) => ({
    x: x0 + (k % cols) * step,
    y: y0 + Math.floor(k / cols) * step,
  }));
}

// Columna de puntos que crece hacia arriba desde una base. Si la columna trae
// mucha masa se ensancha en vez de seguir subiendo: así ninguna invade el
// título, por desbalanceado que esté el corpus.
function column(n: number, minCols: number, cx: number, baseY: number, maxRows: number, maxWidth: number): Slot[] {
  const cols = Math.max(minCols, Math.ceil(n / maxRows));
  const step = Math.min(15, Math.floor(maxWidth / Math.max(cols, 1)));
  const x0 = cx - ((cols - 1) * step) / 2;
  return Array.from({ length: n }, (_, k) => ({
    x: x0 + (k % cols) * step,
    y: baseY - Math.floor(k / cols) * step,
  }));
}

const segColor: Record<string, string> = {
  militante_duro: COLOR.plain,
  pro_candidato_a: COLOR.lime,
  pro_candidato_b: COLOR.magenta,
  anti_candidato_a: COLOR.magenta,
  anti_candidato_b: COLOR.lime,
  anti_extremos: COLOR.electric,
  centro: COLOR.electric,
  indeciso: COLOR.amber,
  voto_blanco: COLOR.dim,
  no_clasificable: COLOR.dim,
};

// Las diez etiquetas del modelo se agrupan en las seis columnas que el ojo
// puede leer de un vistazo. El detalle fino vive en la tabla, no en el video.
const SEG_COLUMNS: { key: string; title: string; segs: string[] }[] = [
  { key: 'duro', title: 'militante duro', segs: ['militante_duro'] },
  { key: 'pro', title: 'pro A / pro B', segs: ['pro_candidato_a', 'pro_candidato_b'] },
  { key: 'anti', title: 'anti candidato', segs: ['anti_candidato_a', 'anti_candidato_b'] },
  { key: 'centro', title: 'centro', segs: ['centro'] },
  { key: 'extremos', title: 'anti extremos', segs: ['anti_extremos'] },
  { key: 'indeciso', title: 'indeciso', segs: ['indeciso', 'voto_blanco'] },
  { key: 'nc', title: 'no clasificable', segs: ['no_clasificable'] },
];

const trColor: Record<string, string> = {
  hacia_a: COLOR.lime,
  hacia_b: COLOR.magenta,
  indefinido: COLOR.amber,
  voto_blanco: COLOR.dim,
  abstencion: COLOR.dim,
  no_aplica: COLOR.faint,
};

const TR_COLUMNS: { key: string; title: string; trs: string[] }[] = [
  { key: 'a', title: 'hacia A', trs: ['hacia_a'] },
  { key: 'b', title: 'hacia B', trs: ['hacia_b'] },
  { key: 'open', title: 'indefinido', trs: ['indefinido'] },
  { key: 'out', title: 'blanco / abstención / no aplica', trs: ['voto_blanco', 'abstencion', 'no_aplica'] },
];

/** Radio del punto: en los actos de movilidad, el tamaño es el score. */
const rByMobility = (mob: number) => 3 + (mob / 100) * 4.5;

export type Act = {
  title: string;
  sub: string;
  chip: string;
  /** Rótulos bajo las columnas del acto, si los hay. */
  legend: { x: number; y: number; title: string; n: number; color: string }[];
};

export function buildPlan() {
  const dots: Dot[] = electoral.dots.map(([v, seg, tr, mob]) => ({
    valid: v === 1,
    seg,
    tr,
    mob,
    at: [],
  }));

  // Lo que no llega a clasificarse —descartado o sin respuesta del modelo— se
  // aparca en una franja al pie desde el acto 3. Sigue en pantalla, porque
  // existió, pero deja de competir por el espacio del relato.
  const outside = dots.filter((d) => !d.valid || d.seg < 0);
  const park = grid(outside.length, 38, W / 2, 648, 11);
  const parkOf = new Map(outside.map((d, k) => [d, { ...park[k], r: 2, fill: COLOR.faint }]));

  const legends: Act['legend'][] = [[], [], [], [], []];

  // Acto 0 — captura: todo el corpus, sin juicio todavía.
  const all = grid(dots.length, 29, W / 2, 400, 24);
  dots.forEach((d, k) => d.at.push({ ...all[k], r: 4, fill: COLOR.plain }));

  // Acto 1 — compuerta de calidad: lo descartado cae a su propia caja.
  const keep = grid(dots.filter((d) => d.valid).length, 27, W / 2 - 110, 390, 23);
  const drop = grid(dots.filter((d) => !d.valid).length, 9, W - 190, 470, 20);
  let ik = 0;
  let id = 0;
  for (const d of dots) {
    d.at.push(d.valid
      ? { ...keep[ik++], r: 4, fill: COLOR.plain }
      : { ...drop[id++], r: 3.4, fill: COLOR.dim });
  }
  legends[1] = [
    { x: W / 2 - 110, y: 592, title: 'válidos', n: electoral.totals.valid, color: COLOR.plain },
    { x: W - 190, y: 592, title: 'descartados', n: electoral.totals.discarded, color: COLOR.dim },
  ];

  // Acto 2 — segmento: quién está hablando.
  const colW = (W - 160) / SEG_COLUMNS.length;
  const segSlots = new Map<string, { slots: Slot[]; used: number; x: number; n: number }>();
  SEG_COLUMNS.forEach((col, ci) => {
    const n = dots.filter((d) => d.valid && col.segs.includes(C.segment[d.seg])).length;
    const x = 80 + colW * ci + colW / 2;
    segSlots.set(col.key, { slots: column(n, 7, x, 556, 17, colW - 22), used: 0, x, n });
    legends[2].push({ x, y: 600, title: col.title, n, color: segColor[col.segs[0]] ?? COLOR.dim });
  });
  for (const d of dots) {
    // Dos filas pasaron la compuerta pero nunca volvieron del clasificador:
    // se quedan donde estaban en vez de inventarles un segmento.
    if (!d.valid || d.seg < 0) { d.at.push(parkOf.get(d)!); continue; }
    const name = C.segment[d.seg];
    const col = SEG_COLUMNS.find((c) => c.segs.includes(name))!;
    const bucket = segSlots.get(col.key)!;
    d.at.push({ ...bucket.slots[bucket.used++], r: 4, fill: segColor[name] ?? COLOR.dim });
  }

  // Acto 3 — movilidad: el corpus se parte en lo que no se mueve y lo que sí.
  const fixed = grid(electoral.mobility.immobile, 22, 360, 400, 20);
  const movable = grid(electoral.mobility.movable, 14, 950, 400, 22);
  let fi = 0;
  let mi = 0;
  for (const d of dots) {
    if (!d.valid || d.seg < 0) { d.at.push(parkOf.get(d)!); continue; }
    d.at.push(d.mob === 0
      ? { ...fixed[fi++], r: 3.2, fill: COLOR.dim }
      : { ...movable[mi++], r: rByMobility(d.mob), fill: COLOR.amber });
  }
  legends[3] = [
    { x: 360, y: 560, title: 'movilidad 0', n: electoral.mobility.immobile, color: COLOR.dim },
    { x: 950, y: 560, title: 'movilidad > 0', n: electoral.mobility.movable, color: COLOR.amber },
  ];

  // Acto 4 — transferencia: a dónde iría cada voto si solo quedan dos.
  const trW = (W - 160) / TR_COLUMNS.length;
  const trSlots = new Map<string, { slots: Slot[]; used: number }>();
  TR_COLUMNS.forEach((col, ci) => {
    const n = dots.filter((d) => d.valid && col.trs.includes(C.transfer[d.tr])).length;
    const x = 80 + trW * ci + trW / 2;
    trSlots.set(col.key, { slots: column(n, 10, x, 540, 18, trW - 30), used: 0 });
    legends[4].push({ x, y: 594, title: col.title, n, color: trColor[col.trs[0]] ?? COLOR.faint });
  });
  for (const d of dots) {
    if (!d.valid || d.tr < 0) { d.at.push(parkOf.get(d)!); continue; }
    const name = C.transfer[d.tr];
    const col = TR_COLUMNS.find((c) => c.trs.includes(name))!;
    const bucket = trSlots.get(col.key)!;
    d.at.push({ ...bucket.slots[bucket.used++], r: name === 'indefinido' ? rByMobility(d.mob) : 4, fill: trColor[name] });
  }

  const t = electoral.totals;
  const openN = electoral.distributions.transfer.find((x) => x.value === 'indefinido')?.n ?? 0;
  const acts: Act[] = [
    {
      chip: 'captura',
      title: `${t.captured} comentarios`,
      sub: `${electoral.source.videos} entrevistas públicas · ${t.authors} autores distintos`,
      legend: legends[0],
    },
    {
      chip: 'calidad',
      title: `${t.discarded} se caen antes de costar`,
      sub: 'Menos de cinco palabras o spam: la compuerta corre antes del modelo',
      legend: legends[1],
    },
    {
      chip: 'segmento',
      title: 'Quién está hablando',
      sub: `${t.analyzed} comentarios clasificados en ${C.segment.length} segmentos de votante`,
      legend: legends[2],
    },
    {
      chip: 'movilidad',
      title: `${electoral.mobility.immobile} no se mueven`,
      sub: `Solo ${electoral.mobility.movable} tienen movilidad > 0. El tamaño del punto es su score`,
      legend: legends[3],
    },
    {
      chip: 'transferencia',
      title: `${openN} votos en disputa`,
      sub: 'Lo demás ya decidió, no aplica o no se deja leer. La campaña se juega ahí',
      legend: legends[4],
    },
  ];

  return { dots, acts };
}

// Ritmo: cada acto entra, se acomoda y respira antes del siguiente.
export const ACT_START = [0, 80, 165, 265, 370];
export const MOVE = 34;
export const DURATION = 500;
export const FPS = 30;
