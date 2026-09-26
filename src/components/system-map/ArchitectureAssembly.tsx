import { useEffect, useMemo, useRef, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { NODE_H, NODE_W, type Layout } from '@/lib/system-map/layout';
import type { ArchComponent, Architecture, Confidence } from '@/lib/system-map/types';
import { ACTIVE, ARROW_IDLE, EDGE_IDLE, LayerLabel, NodeFace, nodeBaseClass, nodeBorder, nodeSurface } from './MapCanvas';
import { EDGE_DASH } from './shared';

// Intro del mapa, compuesta con Remotion: el sistema se monta capa a capa,
// las conexiones se trazan cuando existen sus dos extremos y un paquete
// recorre el flujo principal. El último fotograma es idéntico al mapa
// interactivo, así el relevo no se nota. Se reproduce una vez por proyecto.

const FPS = 60;
const ROW_STEP = 7; // fotogramas entre capas
const NODE_STEP = 2; // entre nodos de una misma capa
const DRAW = 18; // trazado de una conexión
const HOP = 13; // el paquete recorre una conexión
const GLOW = 26; // lo que tarda en apagarse una conexión recorrida

type Plan = {
  width: number;
  height: number;
  rows: { id: string; name: string; y: number; start: number }[];
  nodes: { c: ArchComponent; x: number; y: number; start: number; arrivals: number[] }[];
  edges: { id: string; d: string; confidence: Confidence; start: number; hop: number | null }[];
  packetStart: number;
  duration: number;
};

// Las aristas del layout son `M x,y L x,y` o `M x,y C c1 c2 x,y`.
function pointOn(d: string, t: number) {
  const n = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  if (n.length >= 8) {
    const [x0, y0, x1, y1, x2, y2, x3, y3] = n;
    const u = 1 - t;
    const b = (a: number, p: number, q: number, z: number) => u * u * u * a + 3 * u * u * t * p + 3 * u * t * t * q + t * t * t * z;
    return { x: b(x0, x1, x2, x3), y: b(y0, y1, y2, y3) };
  }
  const [x0, y0, x1, y1] = n;
  return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t };
}

function makePlan(ir: Architecture, layout: Layout): Plan {
  const byId = new Map(ir.components.map((c) => [c.id, c]));
  const start = (id: string) => {
    const box = layout.nodes.get(id)!;
    return 4 + box.row * ROW_STEP + box.col * NODE_STEP;
  };

  // Recorrido del paquete: las conexiones del primer flujo runtime, en orden.
  const flow = ir.flows.find((f) => f.kind === 'runtime' && f.steps.filter((s) => s.relationship).length >= 3);
  const hops: string[] = [];
  for (const s of flow?.steps ?? []) if (s.relationship && hops.at(-1) !== s.relationship) hops.push(s.relationship);

  const edgeStart = new Map(ir.relationships.map((r) => [r.id, Math.max(start(r.source), start(r.target)) + 10]));
  const drawn = Math.max(0, ...[...edgeStart.values()].map((s) => s + DRAW));
  const packetStart = drawn - 6;
  const hopOf = new Map(hops.map((id, i) => [id, packetStart + i * HOP]));

  const arrivals = new Map<string, number[]>();
  for (const [id, t0] of hopOf) {
    const target = ir.relationships.find((r) => r.id === id)?.target;
    if (target) arrivals.set(target, [...(arrivals.get(target) ?? []), t0 + HOP]);
  }

  return {
    width: layout.width,
    height: layout.height,
    rows: layout.rows.map((r, i) => ({ ...r, start: i * ROW_STEP })),
    nodes: [...layout.nodes.values()].map((b) => ({ c: byId.get(b.id)!, x: b.x, y: b.y, start: start(b.id), arrivals: arrivals.get(b.id) ?? [] })),
    edges: ir.relationships.map((r) => ({
      id: r.id,
      d: layout.edges.get(r.id)!.d,
      confidence: r.confidence,
      start: edgeStart.get(r.id)!,
      hop: hopOf.get(r.id) ?? null,
    })),
    packetStart,
    duration: Math.max(drawn, packetStart + hops.length * HOP + GLOW) + 6,
  };
}

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

function Assembly({ plan }: { plan: Plan }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Paquete: en qué conexión está y en qué punto.
  const current = plan.edges.find((e) => e.hop !== null && frame >= e.hop && frame < e.hop + HOP);
  const packet = current
    ? pointOn(current.d, interpolate(frame, [current.hop!, current.hop! + HOP], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) }))
    : null;

  return (
    <AbsoluteFill>
      {plan.rows.map((row, i) => (
        <LayerLabel
          key={row.id}
          row={row}
          first={i === 0}
          opacity={interpolate(frame, [row.start, row.start + 12], [0, 1], clamp)}
          reveal={interpolate(frame, [row.start, row.start + 24], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) })}
        />
      ))}

      <svg className="absolute inset-0 overflow-visible" width={plan.width} height={plan.height}>
        <defs>
          <marker id="sm-intro-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L8,4 L0,8 z" fill={ARROW_IDLE} />
          </marker>
          <filter id="sm-intro-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        {plan.edges.map((e) => {
          const p = interpolate(frame, [e.start, e.start + DRAW], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
          if (p <= 0) return null;
          const lit = e.hop === null ? 0 : interpolate(frame, [e.hop, e.hop + 4, e.hop + HOP, e.hop + HOP + GLOW], [0, 1, 1, 0], clamp);
          return (
            <g key={e.id}>
              {p < 1 ? (
                <path d={e.d} fill="none" stroke={EDGE_IDLE} strokeWidth={1.25} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
              ) : (
                <path d={e.d} fill="none" stroke={EDGE_IDLE} strokeWidth={1.25} strokeDasharray={EDGE_DASH[e.confidence]} markerEnd="url(#sm-intro-arrow)" />
              )}
              {lit > 0 && <path d={e.d} fill="none" stroke={ACTIVE} strokeWidth={2} opacity={lit} />}
            </g>
          );
        })}
        {packet && (
          <g>
            <circle cx={packet.x} cy={packet.y} r={9} fill={ACTIVE} opacity={0.45} filter="url(#sm-intro-glow)" />
            <circle cx={packet.x} cy={packet.y} r={3.5} fill={ACTIVE} />
          </g>
        )}
      </svg>

      {plan.nodes.map(({ c, x, y, start, arrivals }) => {
        const s = spring({ frame: frame - start, fps, config: { damping: 16, stiffness: 180, mass: 0.6 } });
        // Destello al encenderse y cada vez que el paquete llega.
        const flash = Math.max(
          interpolate(frame, [start, start + 3, start + 20], [0, 1, 0], clamp),
          ...arrivals.map((t) => interpolate(frame, [t, t + 3, t + 22], [0, 1, 0], clamp)),
        );
        return (
          <div
            key={c.id}
            className={`${nodeBaseClass} ${nodeSurface(c)}`}
            style={{
              left: x,
              top: y,
              width: NODE_W,
              height: NODE_H,
              opacity: Math.min(1, s * 1.4),
              transform: `translateY(${(1 - s) * 10}px) scale(${0.94 + 0.06 * s})`,
              borderColor: flash > 0.02 ? `rgba(198,255,61,${0.25 + 0.75 * flash})` : nodeBorder(c),
              boxShadow: flash > 0.02 ? `0 6px 24px rgba(198,255,61,${0.3 * flash})` : undefined,
            }}
          >
            <NodeFace c={c} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

export default function ArchitectureAssembly({ ir, layout, onDone }: { ir: Architecture; layout: Layout; onDone: () => void }) {
  const plan = useMemo(() => makePlan(ir, layout), [ir, layout]);
  const player = useRef<PlayerRef>(null);
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const done = useRef(onDone);
  done.current = onDone;

  // El Player mide su caja al montarse: se monta cuando el panel ya terminó
  // de girar y escalarse. Hasta entonces la capa está vacía (fotograma 0).
  useEffect(() => {
    const panel = host.current?.closest<HTMLElement>('[data-sm-panel]');
    if (!panel || panel.dataset.ready) {
      setReady(true);
      return;
    }
    const go = () => setReady(true);
    panel.addEventListener('sm:ready', go, { once: true });
    return () => panel.removeEventListener('sm:ready', go);
  }, []);

  useEffect(() => {
    const p = player.current;
    if (!ready || !p) return;
    const finish = () => done.current();
    p.addEventListener('ended', finish);
    return () => p.removeEventListener('ended', finish);
  }, [ready]);

  return (
    // Un toque salta la intro: nunca bloquea al visitante.
    <div ref={host} className="absolute inset-0 z-10 cursor-pointer" aria-hidden="true" onPointerDown={() => done.current()}>
      {ready && (
        <Player
          ref={player}
          component={Assembly}
          inputProps={{ plan }}
          durationInFrames={plan.duration}
          fps={FPS}
          compositionWidth={plan.width}
          compositionHeight={plan.height}
          style={{ width: '100%', height: '100%' }}
          autoPlay
          controls={false}
          loop={false}
          clickToPlay={false}
          doubleClickToFullscreen={false}
          spaceKeyToPlayOrPause={false}
          acknowledgeRemotionLicense
        />
      )}
    </div>
  );
}
