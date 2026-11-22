// Un estado del pivote, dibujado. No sabe de tiempo ni de Remotion: lo usan
// igual el fotograma animado y el tablero estático.

import { H, W, type Act } from '@/lib/pivot/plan';

/** Nodo y arista ya resueltos: quien llama decide si vienen de un acto exacto
    o de la mezcla entre dos. */
export type PlacedNode = {
  id: string; kind: string; title: string; w: number; h: number;
  x: number; y: number; opacity: number; fill: string;
};
export type PlacedEdge = { id: string; d: string; opacity: number; color: string };

export function PivotScene({
  nodes,
  edges,
  act,
  actIndex,
  acts,
  reveal = 1,
  progress = 1,
  opsOpacity = 0,
}: {
  nodes: PlacedNode[];
  edges: PlacedEdge[];
  act: Act;
  actIndex: number;
  acts: Act[];
  reveal?: number;
  progress?: number;
  opsOpacity?: number;
}) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label={`${act.title}. ${act.sub}`}>
      <rect width={W} height={H} fill="#06060a" />

      {/* Índice de actos: duplica los botones de abajo, así que en pantallas
          chicas se esconde. */}
      <g className="hidden sm:inline" fontFamily="'JetBrains Mono', ui-monospace, monospace" fontSize="12" letterSpacing="1.7">
        {acts.map((a, k) => (
          <g key={a.chip} transform={`translate(${64 + k * 212}, 60)`}>
            <rect
              x="0" y="-16" width="198" height="26"
              fill={k === actIndex ? '#c6ff3d' : 'rgba(255,255,255,0.04)'}
              stroke={k === actIndex ? '#c6ff3d' : 'rgba(255,255,255,0.14)'}
            />
            <text x="12" y="2" fill={k === actIndex ? '#06060a' : 'rgba(255,255,255,0.6)'}>
              {a.chip.toUpperCase()}
            </text>
          </g>
        ))}
      </g>

      <g opacity={reveal} transform={`translate(64, ${146 - (1 - reveal) * 10})`}>
        <text fontFamily="'Bricolage Grotesque', system-ui, sans-serif" fontWeight="700" fontSize="46" fill="#ffffff">
          {act.title}
        </text>
        <text y="34" fontFamily="'JetBrains Mono', ui-monospace, monospace" fontSize="15" fill="rgba(255,255,255,0.6)">
          {act.sub}
        </text>
      </g>

      <g>
        {edges.map((e) => (e.opacity <= 0.01 ? null : (
          <path key={e.id} d={e.d} fill="none" stroke={e.color} strokeWidth="1.5" opacity={e.opacity} />
        )))}
      </g>

      <g>
        {nodes.map((n) => {
          if (n.opacity <= 0.01) return null;
          return (
            <g key={n.id} opacity={n.opacity} transform={`translate(${n.x}, ${n.y})`}>
              <rect width={n.w} height={n.h} fill="#0a0a12" stroke={n.fill} strokeWidth="1.5" />
              <rect width="3" height={n.h} fill={n.fill} />
              <text
                x="14" y="24"
                fontFamily="'JetBrains Mono', ui-monospace, monospace"
                fontSize="9" letterSpacing="1.5"
                fill="rgba(255,255,255,0.5)"
              >
                {n.kind.toUpperCase()}
              </text>
              <text
                x="14" y="48"
                fontFamily="'Bricolage Grotesque', system-ui, sans-serif"
                fontWeight="700" fontSize="15"
                fill="#ffffff"
              >
                {n.title}
              </text>
            </g>
          );
        })}
      </g>

      {/* La franja de operación aparece en el último acto. */}
      <g opacity={opsOpacity} transform="translate(140, 600)">
        <text fontFamily="'JetBrains Mono', ui-monospace, monospace" fontSize="13" letterSpacing="2" fill="rgba(255,255,255,0.6)">
          SYSTEMD · INGESTA 6 H · SALUD 5 MIN · ALERTAS AL MISMO TELEGRAM
        </text>
      </g>

      <rect x="64" y={H - 46} width={W - 128} height="2" fill="rgba(255,255,255,0.1)" />
      <rect x="64" y={H - 46} width={(W - 128) * progress} height="2" fill="#c6ff3d" />
    </svg>
  );
}
