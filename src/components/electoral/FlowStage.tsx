// Composición de Remotion: el corpus se reorganiza acto por acto.
// Se carga bajo demanda desde VoterFlow; nada de esto entra al bundle inicial.

import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { ACT_START, DURATION, MOVE, type Act, type Dot } from '@/lib/electoral/flowPlan';
import { FlowScene, type Placed } from './FlowScene';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// Mezcla de color entre dos actos. Acepta hex y rgba() porque la paleta usa
// ambos: los acentos son sólidos y los apagados son blanco con alfa.
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

export default function FlowStage({ dots, acts }: { dots: Dot[]; acts: Act[] }) {
  const frame = useCurrentFrame();

  const index = Math.max(0, ACT_START.filter((s) => frame >= s).length - 1);
  const t = interpolate(frame, [ACT_START[index], ACT_START[index] + MOVE], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

  // El primer acto no viene de ningún lado: los puntos aparecen desde abajo.
  const placed: Placed[] = dots.map((d) => {
    const to = d.at[index];
    if (index === 0) {
      return { x: to.x, y: to.y + (1 - t) * 90, r: to.r * t, fill: to.fill };
    }
    const from = d.at[index - 1];
    return {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
      r: from.r + (to.r - from.r) * t,
      fill: mix(from.fill, to.fill, t),
    };
  });

  // El rótulo del acto anterior se va mientras los puntos viajan, y el nuevo
  // entra cuando ya casi llegaron: en ningún fotograma queda el hueco.
  const start = ACT_START[index];
  const swap = start + MOVE * 0.5;
  const reveal = index === 0
    ? interpolate(frame, [MOVE * 0.5, MOVE * 0.5 + 14], [0, 1], clamp)
    : interpolate(frame, [start, start + 9, swap, swap + 14], [1, 0, 0, 1], clamp);
  const shown = index > 0 && frame < swap ? index - 1 : index;

  return (
    <AbsoluteFill style={{ backgroundColor: '#06060a' }}>
      <FlowScene
        placed={placed}
        act={acts[shown]}
        actIndex={shown}
        acts={acts}
        reveal={reveal}
        progress={Math.min(1, frame / DURATION)}
      />
    </AbsoluteFill>
  );
}
