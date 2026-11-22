// Dos botones, dos mapas. Reutiliza el mismo diálogo y el mismo lienzo que
// usan las tarjetas de proyecto: el visitante no aprende una interfaz nueva
// para ver la arquitectura de antes.
//
// Ninguno de los dos artefactos se descarga hasta que alguien pide verlo.

import { lazy, Suspense, useRef, useState } from 'react';
import type { Architecture } from '@/lib/system-map/types';
import ArchitectureDialog from '../system-map/ArchitectureDialog';

const loadBack = () => import('../system-map/ArchitectureBack');
const ArchitectureBack = lazy(loadBack);

const baseUrl = import.meta.env.BASE_URL.replace(/\/?$/, '/');
const routePath = (path: string) => `${baseUrl}${path.replace(/^\/+/, '')}`;

const MAPS = [
  {
    slug: 'indexer',
    label: 'Ver el mapa de antes',
    title: 'Indexer · antes del pivote',
    subtitle: 'Motor de rutas: captura por extensión, clasificación por reglas e interfaz web.',
    accent: 'text-white/70',
  },
  {
    slug: 'botrepos',
    label: 'Ver el mapa de ahora',
    title: 'botRepos · después del pivote',
    subtitle: 'Búsqueda semántica servida por el chat, con su propia capa de operación.',
    accent: 'text-accent-magenta',
  },
] as const;

export default function MapCompare() {
  const [open, setOpen] = useState<(typeof MAPS)[number] | null>(null);
  const [ir, setIr] = useState<Architecture | null>(null);
  const [failed, setFailed] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  const show = (map: (typeof MAPS)[number], button: HTMLButtonElement) => {
    trigger.current = button;
    setIr(null);
    setFailed(false);
    setOpen(map);
    void loadBack();
    fetch(routePath(`/projects/${map.slug}/architecture.json`))
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then(setIr)
      .catch(() => setFailed(true));
  };

  return (
    <div ref={host}>
      <div className="flex flex-wrap gap-3">
        {MAPS.map((map) => (
          <button
            key={map.slug}
            type="button"
            onClick={(e) => show(map, e.currentTarget)}
            className={`inline-flex items-center gap-2 border-2 px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.18em] transition ${
              map.slug === 'botrepos'
                ? 'border-black bg-accent-magenta text-ink-950 shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5'
                : 'border-white/30 bg-white/5 text-white/80 hover:border-white/60 hover:bg-white/10'
            }`}
          >
            {map.label} <span aria-hidden="true">↻</span>
          </button>
        ))}
      </div>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white/55">
        generados del código y validados contra su commit
      </p>

      {open && (
        <ArchitectureDialog
          slug={open.slug}
          title={open.title}
          subtitle={open.subtitle}
          accentClass={open.accent}
          source={host}
          returnFocus={trigger}
          deepLinked={false}
          onClosed={() => setOpen(null)}
        >
          {ir ? (
            <Suspense fallback={<Loading />}>
              <ArchitectureBack ir={ir} />
            </Suspense>
          ) : failed ? (
            <div className="py-16 text-center">
              <p className="text-white/60">No se pudo cargar el mapa.</p>
            </div>
          ) : (
            <Loading />
          )}
        </ArchitectureDialog>
      )}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/55">cargando el mapa…</span>
    </div>
  );
}
