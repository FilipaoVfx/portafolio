// La geometría del pivote, sin Remotion.
//
// Dos cadenas que comparten un nodo: la de arriba es lo que construí primero
// (Indexer) y la de abajo es lo que quedó (botRepos). El relato es el corte —
// qué se conserva y qué se tira— así que la cadena nueva ocupa exactamente las
// mismas columnas que la cola que muere. El último fotograma es el tablero
// estático, de modo que el relevo entre animación y fallback no se nota.

export const W = 1280;
export const H = 720;

const NODE_W = 176;
const NODE_H = 68;
const GAP = 30;
const X0 = 140;
const ROW_OLD = 236;
const ROW_NEW = 470;

const col = (i: number) => X0 + i * (NODE_W + GAP);

export const COLOR = {
  core: '#c6ff3d',
  next: '#ff3dd1',
  plain: 'rgba(255,255,255,0.55)',
  dim: 'rgba(255,255,255,0.14)',
  ghost: 'rgba(255,255,255,0.05)',
} as const;

type Shape = { x: number; y: number; opacity: number; fill: string; label: string };

export type PivotNode = {
  id: string;
  kind: string;
  title: string;
  w: number;
  h: number;
  /** Estado en cada acto. */
  at: Shape[];
};

export type PivotEdge = {
  id: string;
  from: string;
  to: string;
  /** Opacidad y color por acto. */
  at: { opacity: number; color: string }[];
};

export type Act = { chip: string; title: string; sub: string };

// Cadena vieja: captura → ingesta → corpus → ranking → interfaz.
// Cadena nueva: corpus → embeddings → índice → Telegram.
const NODES = [
  { id: 'ext', kind: 'chrome mv3', title: 'Extensión', row: 'old', i: 0, fate: 'keep' },
  { id: 'ing', kind: 'node', title: 'Ingesta', row: 'old', i: 1, fate: 'keep' },
  { id: 'corpus', kind: 'postgres', title: 'Corpus clasificado', row: 'old', i: 2, fate: 'core' },
  { id: 'rank', kind: 'fts + trigramas', title: 'Ranking por reglas', row: 'old', i: 3, fate: 'cut' },
  { id: 'web', kind: 'astro', title: 'Interfaz web', row: 'old', i: 4, fate: 'cut' },
  { id: 'emb', kind: 'openai', title: 'Chunking + embeddings', row: 'new', i: 2, fate: 'new' },
  { id: 'vec', kind: 'pinecone', title: 'Índice vectorial', row: 'new', i: 3, fate: 'new' },
  { id: 'bot', kind: 'telegram + cli', title: 'Donde ya preguntas', row: 'new', i: 4, fate: 'new' },
] as const;

const EDGES = [
  { id: 'e1', from: 'ext', to: 'ing', fate: 'keep' },
  { id: 'e2', from: 'ing', to: 'corpus', fate: 'keep' },
  { id: 'e3', from: 'corpus', to: 'rank', fate: 'cut' },
  { id: 'e4', from: 'rank', to: 'web', fate: 'cut' },
  { id: 'e5', from: 'corpus', to: 'emb', fate: 'new' },
  { id: 'e6', from: 'emb', to: 'vec', fate: 'new' },
  { id: 'e7', from: 'vec', to: 'bot', fate: 'new' },
] as const;

export const ACTS: Act[] = [
  {
    chip: 'lo que construí',
    title: 'Un motor de rutas',
    sub: 'Capturar recursos, clasificarlos y responder «necesitas estas piezas, en este orden»',
  },
  {
    chip: 'el dato',
    title: 'El valor no estaba donde lo diseñé',
    sub: 'Lo que servía era el corpus de abajo: READMEs limpios, clasificados y con evidencia',
  },
  {
    chip: 'el corte',
    title: 'Maté la interfaz, no el motor',
    sub: 'Nadie abre una web para resolver una duda de diez segundos',
  },
  {
    chip: 'lo que vino encima',
    title: 'El mismo corpus, otra salida',
    sub: 'Embeddings, índice vectorial y la interfaz que ya está abierta en tu teléfono',
  },
  {
    chip: 'hoy',
    title: 'En producción',
    sub: 'Ingesta cada 6 h · salud cada 5 min · alertas por el mismo canal',
  },
];

/** Qué tan visible está cada destino en cada acto. */
const FADE: Record<string, number[]> = {
  keep: [1, 0.55, 0.45, 0.4, 0.4],
  core: [1, 1, 1, 1, 1],
  cut: [1, 0.55, 0.12, 0.06, 0.06],
  new: [0, 0, 0, 1, 1],
};

const TINT: Record<string, string[]> = {
  keep: [COLOR.plain, COLOR.plain, COLOR.dim, COLOR.dim, COLOR.dim],
  core: [COLOR.plain, COLOR.core, COLOR.core, COLOR.core, COLOR.core],
  cut: [COLOR.plain, COLOR.plain, COLOR.dim, COLOR.ghost, COLOR.ghost],
  new: [COLOR.ghost, COLOR.ghost, COLOR.ghost, COLOR.next, COLOR.next],
};

export function buildPivot() {
  const nodes: PivotNode[] = NODES.map((n) => {
    const x = col(n.i);
    const baseY = n.row === 'old' ? ROW_OLD : ROW_NEW;
    return {
      id: n.id,
      kind: n.kind,
      title: n.title,
      w: NODE_W,
      h: NODE_H,
      at: FADE[n.fate].map((opacity, act) => ({
        x,
        // Lo que se corta se descuelga un poco al morir; lo nuevo sube al entrar.
        y: baseY + (n.fate === 'cut' && act >= 2 ? 22 : 0) + (n.fate === 'new' && act < 3 ? 26 : 0),
        opacity,
        fill: TINT[n.fate][act],
        label: n.title,
      })),
    };
  });

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edges: PivotEdge[] = EDGES.map((e) => ({
    id: e.id,
    from: e.from,
    to: e.to,
    at: FADE[e.fate].map((opacity, act) => ({
      opacity: opacity * 0.8,
      color: TINT[e.fate][act],
    })),
  }));

  // Trazado: horizontal dentro de una fila, y en escuadra cuando baja de fila.
  const path = (e: PivotEdge, act: number) => {
    const a = byId.get(e.from)!.at[act];
    const b = byId.get(e.to)!.at[act];
    const ah = byId.get(e.from)!.h;
    if (Math.abs(a.y - b.y) < 4) {
      return `M${a.x + NODE_W},${a.y + ah / 2} L${b.x},${b.y + ah / 2}`;
    }
    const midY = (a.y + ah + b.y) / 2;
    return `M${a.x + NODE_W / 2},${a.y + ah} L${a.x + NODE_W / 2},${midY} L${b.x + NODE_W / 2},${midY} L${b.x + NODE_W / 2},${b.y}`;
  };

  return { nodes, edges, acts: ACTS, path };
}

// Ritmo: cada acto entra, se lee y respira antes del siguiente.
export const ACT_START = [0, 95, 185, 275, 380];
export const MOVE = 34;
export const DURATION = 500;
export const FPS = 30;
