// El cuadro: dibuja un estado del plan. No sabe de tiempo ni de Remotion, así
// que sirve igual para el fotograma animado y para el tablero estático que ve
// quien no carga el reproductor.

import { H, W, type Act } from '@/lib/electoral/flowPlan';

export type Placed = { x: number; y: number; r: number; fill: string };

export function FlowScene({
  placed,
  act,
  actIndex,
  acts,
  reveal = 1,
  progress = 1,
}: {
  placed: Placed[];
  act: Act;
  actIndex: number;
  acts: Act[];
  /** 0 → 1: entrada del rótulo del acto. */
  reveal?: number;
  /** 0 → 1: avance total, para la barra inferior. */
  progress?: number;
}) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label={`${act.title}. ${act.sub}`}>
      <rect width={W} height={H} fill="#06060a" />

      {/* Índice de actos: dónde va el relato. Duplica a los botones de abajo,
          así que en pantallas chicas sobra y se esconde. */}
      <g className="hidden sm:inline" fontFamily="'JetBrains Mono', ui-monospace, monospace" fontSize="12" letterSpacing="1.7">
        {acts.map((a, k) => (
          <g key={a.chip} transform={`translate(${64 + k * 160}, 64)`}>
            <rect
              x="0" y="-16" width="146" height="26"
              fill={k === actIndex ? '#c6ff3d' : 'rgba(255,255,255,0.04)'}
              stroke={k === actIndex ? '#c6ff3d' : 'rgba(255,255,255,0.14)'}
            />
            <text x="12" y="2" fill={k === actIndex ? '#06060a' : 'rgba(255,255,255,0.6)'}>
              {a.chip.toUpperCase()}
            </text>
          </g>
        ))}
      </g>

      {/* Título del acto. */}
      <g opacity={reveal} transform={`translate(64, ${150 - (1 - reveal) * 10})`}>
        <text fontFamily="'Bricolage Grotesque', system-ui, sans-serif" fontWeight="700" fontSize="56" fill="#ffffff">
          {act.title}
        </text>
        <text y="38" fontFamily="'JetBrains Mono', ui-monospace, monospace" fontSize="17" fill="rgba(255,255,255,0.55)">
          {act.sub}
        </text>
      </g>

      {/* Un círculo por comentario. */}
      <g>
        {placed.map((p, k) => (
          <circle key={k} cx={p.x} cy={p.y} r={p.r} fill={p.fill} />
        ))}
      </g>

      {/* Rótulos de los grupos del acto. */}
      <g opacity={reveal} textAnchor="middle" fontFamily="'JetBrains Mono', ui-monospace, monospace">
        {act.legend.map((l) => (
          <g key={l.title} transform={`translate(${l.x}, ${l.y})`}>
            <text fontSize="26" fontWeight="700" fill={l.color}>{l.n}</text>
            <text y="20" fontSize="12" letterSpacing="1.6" fill="rgba(255,255,255,0.6)">
              {l.title.toUpperCase()}
            </text>
          </g>
        ))}
      </g>

      <rect x="64" y={H - 46} width={W - 128} height="2" fill="rgba(255,255,255,0.1)" />
      <rect x="64" y={H - 46} width={(W - 128) * progress} height="2" fill="#c6ff3d" />
    </svg>
  );
}
