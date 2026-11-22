// Composición de Remotion: la cadena vieja se arma, el núcleo se enciende, la
// cola muere y de ese mismo núcleo crece la cadena nueva. Se descarga bajo
// demanda desde PivotFlow; nada de esto entra al bundle inicial.

import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { ACT_START, DURATION, MOVE, buildPivot } from '@/lib/pivot/plan';
import { PivotScene, type PlacedEdge, type PlacedNode } from './PivotScene';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// Mezcla de color entre dos actos; la paleta usa hex y rgba a la vez.
function parse(c: string): [number, number, number, number] {
  if (c.startsWith('#')) {
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const [r, g, b, a = '1'] = c.slice(c.indexOf('(') + 1, -1).split(',');
  return [Number(r), Number(g), Number(b), Number(a)];
}

function mix(from: string, to: string, t: number) {
  const a = parse(from);
  const b = parse(to);
  const v = a.map((x, k) => x + (b[k] - x) * t);
  return `rgba(${Math.round(v[0])},${Math.round(v[1])},${Math.round(v[2])},${v[3].toFixed(3)})`;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export default function PivotStage({ plan }: { plan: ReturnType<typeof buildPivot> }) {
  const frame = useCurrentFrame();
  const { nodes, edges, acts, path } = plan;

  const index = Math.max(0, ACT_START.filter((s) => frame >= s).length - 1);
  const prev = Math.max(0, index - 1);
  const t = interpolate(frame, [ACT_START[index], ACT_START[index] + MOVE], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

  const placedNodes: PlacedNode[] = nodes.map((n) => {
    const to = n.at[index];
    const from = n.at[prev];
    const k = index === 0 ? t : t;
    return {
      id: n.id,
      kind: n.kind,
      title: n.title,
      w: n.w,
      h: n.h,
      x: lerp(from.x, to.x, k),
      y: lerp(from.y, to.y, k),
      // En el primer acto los nodos entran escalonados de izquierda a derecha.
      opacity: index === 0
        ? interpolate(frame, [n.at[0].x / 90, n.at[0].x / 90 + 16], [0, to.opacity], clamp)
        : lerp(from.opacity, to.opacity, k),
      fill: mix(from.fill, to.fill, k),
    };
  });

  const placedEdges: PlacedEdge[] = edges.map((e) => {
    const to = e.at[index];
    const from = e.at[prev];
    return {
      id: e.id,
      // El trazado se toma del acto de destino: las aristas no se deforman a
      // medio camino, aparecen y desaparecen.
      d: path(e, t > 0.5 ? index : prev),
      opacity: lerp(from.opacity, to.opacity, t),
      color: mix(from.color, to.color, t),
    };
  });

  // El rótulo del acto anterior sale mientras las piezas viajan; el nuevo
  // entra cuando ya llegaron.
  const start = ACT_START[index];
  const swap = start + MOVE * 0.5;
  const reveal = index === 0
    ? interpolate(frame, [MOVE * 0.6, MOVE * 0.6 + 14], [0, 1], clamp)
    : interpolate(frame, [start, start + 9, swap, swap + 14], [1, 0, 0, 1], clamp);
  const shown = index > 0 && frame < swap ? index - 1 : index;

  return (
    <AbsoluteFill style={{ backgroundColor: '#06060a' }}>
      <PivotScene
        nodes={placedNodes}
        edges={placedEdges}
        act={acts[shown]}
        actIndex={shown}
        acts={acts}
        reveal={reveal}
        progress={Math.min(1, frame / DURATION)}
        opsOpacity={interpolate(frame, [ACT_START[4] + MOVE * 0.6, ACT_START[4] + MOVE * 0.6 + 16], [0, 1], clamp)}
      />
    </AbsoluteFill>
  );
}
