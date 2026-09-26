// Layout por capas: cada grupo del IR es una fila, en el orden declarado.
// Dentro de cada fila, intercambios adyacentes reducen longitud y cruces de
// aristas. Determinista: mismo IR, mismo dibujo (sin física ni azar).

import type { ArchComponent, ArchRelationship, Architecture } from './types';

// Medidas pensadas para el panel de arquitectura: el sistema entero debe
// caber de un vistazo con nombres legibles. Las etiquetas de capa van a la
// izquierda de cada fila para no gastar altura.
export const NODE_W = 150;
export const NODE_H = 54;
export const LABEL_W = 118;
const GAP_X = 14;
export const ROW_GAP = 34;
const PAD_X = 12;
const PAD_Y = 10;

export type NodeBox = { id: string; x: number; y: number; row: number; col: number };
export type RowBox = { id: string; name: string; y: number };
export type EdgePath = { id: string; d: string; mid: { x: number; y: number } };
export type Layout = {
  width: number;
  height: number;
  nodes: Map<string, NodeBox>;
  rows: RowBox[];
  edges: Map<string, EdgePath>;
  grid: string[][];
};

function order(rows: string[][], edges: ArchRelationship[]) {
  const pos = new Map<string, { row: number; col: number }>();
  const index = () => rows.forEach((r, ri) => r.forEach((id, ci) => pos.set(id, { row: ri, col: ci })));
  const widest = Math.max(...rows.map((r) => r.length));
  // Posición horizontal normalizada: filas centradas.
  const xOf = (id: string) => {
    const p = pos.get(id)!;
    return p.col - (rows[p.row].length - 1) / 2 + widest;
  };
  const cost = () => {
    let total = 0;
    for (const e of edges) total += Math.abs(xOf(e.source) - xOf(e.target)) * (pos.get(e.source)!.row === pos.get(e.target)!.row ? 2 : 1);
    for (let i = 0; i < edges.length; i += 1) {
      for (let j = i + 1; j < edges.length; j += 1) {
        const a = edges[i];
        const b = edges[j];
        const [a1, a2] = [pos.get(a.source)!, pos.get(a.target)!];
        const [b1, b2] = [pos.get(b.source)!, pos.get(b.target)!];
        const sameBand = Math.min(a1.row, a2.row) === Math.min(b1.row, b2.row) && Math.max(a1.row, a2.row) === Math.max(b1.row, b2.row);
        if (!sameBand || a1.row === a2.row) continue;
        const [aTop, aBot] = a1.row < a2.row ? [a.source, a.target] : [a.target, a.source];
        const [bTop, bBot] = b1.row < b2.row ? [b.source, b.target] : [b.target, b.source];
        if ((xOf(aTop) - xOf(bTop)) * (xOf(aBot) - xOf(bBot)) < 0) total += 3;
      }
    }
    return total;
  };

  index();
  let best = cost();
  for (let pass = 0; pass < 12; pass += 1) {
    let improved = false;
    for (const row of rows) {
      for (let i = 0; i < row.length - 1; i += 1) {
        [row[i], row[i + 1]] = [row[i + 1], row[i]];
        index();
        const c = cost();
        if (c < best) {
          best = c;
          improved = true;
        } else {
          [row[i], row[i + 1]] = [row[i + 1], row[i]];
          index();
        }
      }
    }
    if (!improved) break;
  }
}

export function computeLayout(ir: Architecture): Layout {
  const byGroup = new Map<string, ArchComponent[]>();
  for (const c of ir.components) {
    if (!byGroup.has(c.group)) byGroup.set(c.group, []);
    byGroup.get(c.group)!.push(c);
  }
  const groups = ir.groups.filter((g) => byGroup.has(g.id));
  const grid = groups.map((g) => byGroup.get(g.id)!.map((c) => c.id));
  order(grid, ir.relationships);

  const widest = Math.max(...grid.map((r) => r.length));
  const width = LABEL_W + PAD_X * 2 + widest * NODE_W + (widest - 1) * GAP_X;
  const rowPitch = NODE_H + ROW_GAP;
  const height = PAD_Y + grid.length * rowPitch - ROW_GAP + PAD_Y;

  const nodes = new Map<string, NodeBox>();
  const rows: RowBox[] = [];
  grid.forEach((row, ri) => {
    const y = PAD_Y + ri * rowPitch;
    rows.push({ id: groups[ri].id, name: groups[ri].name, y });
    const rowWidth = row.length * NODE_W + (row.length - 1) * GAP_X;
    const x0 = LABEL_W + (width - LABEL_W - rowWidth) / 2;
    row.forEach((id, ci) => nodes.set(id, { id, x: x0 + ci * (NODE_W + GAP_X), y, row: ri, col: ci }));
  });

  // Puertos: las aristas que salen por un mismo lado se reparten a lo ancho
  // del nodo, ordenadas por la posición del otro extremo.
  type Port = { edge: string; other: number };
  const ports = new Map<string, Port[]>();
  const attach = (node: string, side: string, edge: string, other: number) => {
    const key = `${node}:${side}`;
    if (!ports.has(key)) ports.set(key, []);
    ports.get(key)!.push({ edge, other });
  };
  const center = (id: string) => nodes.get(id)!.x + NODE_W / 2;
  for (const r of ir.relationships) {
    const s = nodes.get(r.source)!;
    const t = nodes.get(r.target)!;
    if (s.row === t.row) continue;
    const down = t.row > s.row;
    attach(r.source, down ? 'bottom' : 'top', r.id, center(r.target));
    attach(r.target, down ? 'top' : 'bottom', r.id, center(r.source));
  }
  const portX = (node: string, side: string, edge: string) => {
    const list = ports.get(`${node}:${side}`)!;
    const sorted = [...list].sort((a, b) => a.other - b.other);
    const i = sorted.findIndex((p) => p.edge === edge);
    const span = NODE_W * 0.64;
    const box = nodes.get(node)!;
    return box.x + NODE_W / 2 + (sorted.length === 1 ? 0 : -span / 2 + (span * i) / (sorted.length - 1));
  };

  const edges = new Map<string, EdgePath>();
  for (const r of ir.relationships) {
    const s = nodes.get(r.source)!;
    const t = nodes.get(r.target)!;
    if (s.row === t.row) {
      // Misma fila: arco por debajo de los nodos.
      const forward = t.x > s.x;
      const sx = forward ? s.x + NODE_W : s.x;
      const tx = forward ? t.x : t.x + NODE_W;
      const y = s.y + NODE_H * 0.72;
      const adjacent = Math.abs(t.col - s.col) === 1;
      const dip = adjacent ? 0 : 26 + Math.abs(t.col - s.col) * 6;
      const d = adjacent
        ? `M${sx},${y} L${tx},${y}`
        : `M${s.x + NODE_W / 2},${s.y + NODE_H} C${s.x + NODE_W / 2},${s.y + NODE_H + dip} ${t.x + NODE_W / 2},${t.y + NODE_H + dip} ${t.x + NODE_W / 2},${t.y + NODE_H}`;
      edges.set(r.id, {
        id: r.id,
        d,
        mid: adjacent ? { x: (sx + tx) / 2, y } : { x: (s.x + t.x + NODE_W) / 2, y: s.y + NODE_H + dip * 0.75 },
      });
      continue;
    }
    const down = t.row > s.row;
    const sx = portX(r.source, down ? 'bottom' : 'top', r.id);
    const tx = portX(r.target, down ? 'top' : 'bottom', r.id);
    const sy = down ? s.y + NODE_H : s.y;
    const ty = down ? t.y : t.y + NODE_H;
    const bend = (ty - sy) * 0.5;
    edges.set(r.id, {
      id: r.id,
      d: `M${sx},${sy} C${sx},${sy + bend} ${tx},${ty - bend} ${tx},${ty}`,
      mid: { x: (sx + tx) / 2, y: (sy + ty) / 2 },
    });
  }

  return { width, height, nodes, rows, edges, grid };
}
