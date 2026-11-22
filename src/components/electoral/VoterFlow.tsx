// Isla del caso: el mismo tablero se puede recorrer a mano o ver animado.
//
// Por defecto se pinta el último acto en SVG estático, que es lo que ve quien
// llega con movimiento reducido, en móvil o con el JavaScript a medio cargar.
// El reproductor de Remotion solo se descarga si alguien lo pide o si el
// bloque entra en pantalla en un escritorio sin movimiento reducido.

import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { PlayerRef } from '@remotion/player';
import { ACT_START, DURATION, FPS, H, MOVE, W, buildPlan } from '@/lib/electoral/flowPlan';
import { FlowScene } from './FlowScene';

const Player = lazy(() => import('@remotion/player').then((m) => ({ default: m.Player })));
const stage = () => import('./FlowStage');
const Stage = lazy(stage);

export default function VoterFlow() {
  const { dots, acts } = useMemo(() => buildPlan(), []);
  const [act, setAct] = useState(acts.length - 1);
  const [playing, setPlaying] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<PlayerRef>(null);

  const placed = useMemo(() => dots.map((d) => d.at[act]), [dots, act]);

  // Autoarranque: una sola vez, solo en escritorio y solo si el visitante no
  // pidió menos movimiento. El observador se desconecta pase lo que pase.
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

  const replay = () => {
    setAct(0);
    setPlaying(true);
  };

  return (
    <div>
      {/* En pantallas angostas el tablero no se encoge hasta volverse ilegible:
          mantiene un ancho mínimo y se arrastra de lado. */}
      <div className="overflow-x-auto border-2 border-white/80 bg-ink-950 shadow-[8px_8px_0_0_rgba(255,255,255,0.12)]">
      <div
        ref={host}
        className="relative min-w-[620px]"
        style={{ aspectRatio: `${W} / ${H}` }}
      >
        {playing ? (
          <Suspense fallback={null}>
            <Player
              ref={player}
              component={Stage}
              inputProps={{ dots, acts }}
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
          <FlowScene
            placed={placed}
            act={acts[act]}
            actIndex={act}
            acts={acts}
            progress={(ACT_START[act] + MOVE) / DURATION}
          />
        )}
      </div>
      </div>

      {/* Mandos: recorrer los actos a mano es la versión accesible del video. */}
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
          onClick={replay}
          className="ml-auto inline-flex items-center gap-2 border-2 border-black bg-accent-lime px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-ink-950 shadow-[4px_4px_0_0_#000] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
        >
          {playing ? 'reproduciendo…' : 'reproducir ▸'}
        </button>
      </div>

      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-white/55">
        cada punto es un comentario real · sin autor, sin texto, solo su clasificación
      </p>
    </div>
  );
}
