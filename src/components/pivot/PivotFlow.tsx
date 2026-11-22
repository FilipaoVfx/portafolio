// Isla del pivote: el mismo tablero se recorre a mano o se ve animado.
//
// Por defecto se pinta el último acto en SVG estático —lo que ve quien llega
// con movimiento reducido o con el JavaScript a medio cargar— y el reproductor
// de Remotion solo se descarga si alguien lo pide o si el bloque entra en
// pantalla en un escritorio sin movimiento reducido.

import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { PlayerRef } from '@remotion/player';
import { ACT_START, DURATION, FPS, H, MOVE, W, buildPivot } from '@/lib/pivot/plan';
import { PivotScene } from './PivotScene';

const Player = lazy(() => import('@remotion/player').then((m) => ({ default: m.Player })));
const stage = () => import('./PivotStage');
const Stage = lazy(stage);

export default function PivotFlow() {
  const plan = useMemo(() => buildPivot(), []);
  const { nodes, edges, acts, path } = plan;
  const [act, setAct] = useState(acts.length - 1);
  const [playing, setPlaying] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<PlayerRef>(null);

  const placedNodes = useMemo(
    () => nodes.map((n) => ({ id: n.id, kind: n.kind, title: n.title, w: n.w, h: n.h, ...n.at[act] })),
    [nodes, act],
  );
  const placedEdges = useMemo(
    () => edges.map((e) => ({ id: e.id, d: path(e, act), ...e.at[act] })),
    [edges, act, path],
  );

  useEffect(() => {
    const node = host.current;
    if (!node || !window.matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)').matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        void stage();
        setAct(0);
        setPlaying(true);
      },
      { threshold: 0.45 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const p = player.current;
    if (!playing || !p) return;
    const end = () => {
      setPlaying(false);
      setAct(acts.length - 1);
    };
    p.addEventListener('ended', end);
    return () => p.removeEventListener('ended', end);
  }, [playing, acts.length]);

  return (
    <div>
      {/* En pantallas angostas el tablero no se encoge hasta volverse
          ilegible: mantiene un ancho mínimo y se arrastra de lado. */}
      <div className="overflow-x-auto border-2 border-white/80 bg-ink-950 shadow-[8px_8px_0_0_rgba(255,255,255,0.12)]">
        <div ref={host} className="relative min-w-[680px]" style={{ aspectRatio: `${W} / ${H}` }}>
          {playing ? (
            <Suspense fallback={null}>
              <Player
                ref={player}
                component={Stage}
                inputProps={{ plan }}
                durationInFrames={DURATION}
                fps={FPS}
                compositionWidth={W}
                compositionHeight={H}
                style={{ width: '100%', height: '100%' }}
                autoPlay
                controls={false}
                loop={false}
                clickToPlay={false}
                doubleClickToFullscreen={false}
                spaceKeyToPlayOrPause={false}
                acknowledgeRemotionLicense
              />
            </Suspense>
          ) : (
            <PivotScene
              nodes={placedNodes}
              edges={placedEdges}
              act={acts[act]}
              actIndex={act}
              acts={acts}
              progress={(ACT_START[act] + MOVE) / DURATION}
              opsOpacity={act >= 4 ? 1 : 0}
            />
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {acts.map((a, k) => (
          <button
            key={a.chip}
            type="button"
            onClick={() => {
              setPlaying(false);
              setAct(k);
            }}
            aria-pressed={!playing && act === k}
            className={`px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] border transition ${
              !playing && act === k
                ? 'border-accent-lime bg-accent-lime text-ink-950'
                : 'border-white/15 bg-white/5 text-white/60 hover:text-white hover:border-white/40'
            }`}
          >
            {k + 1}. {a.chip}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setAct(0);
            setPlaying(true);
          }}
          className="ml-auto inline-flex items-center gap-2 border-2 border-black bg-accent-lime px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-ink-950 shadow-[4px_4px_0_0_#000] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
        >
          {playing ? 'reproduciendo…' : 'reproducir ▸'}
        </button>
      </div>
    </div>
  );
}
