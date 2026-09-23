import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { NODE_H, NODE_W, type Layout } from '@/lib/system-map/layout';
import type { ArchComponent, ArchRelationship, Confidence } from '@/lib/system-map/types';
import { COMPONENT_TYPE, CONFIDENCE, EDGE_DASH } from './shared';

type Props = {
  layout: Layout;
  components: Map<string, ArchComponent>;
  relationships: ArchRelationship[];
  selectedNode: string | null;
  selectedEdge: string | null;
  activeLevels: Set<Confidence>;
  // Resaltado de un flujo runtime: aristas con su número de paso.
  flow?: { components: Set<string>; edges: Map<string, string> } | null;
  onSelectNode: (id: string, trigger: HTMLElement) => void;
  onSelectEdge: (id: string) => void;
};

const ACTIVE = '#c6ff3d';

export default function MapCanvas({ layout, components, relationships, selectedNode, selectedEdge, activeLevels, flow, onSelectNode, onSelectEdge }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>());
  const [scale, setScale] = useState(1);
  const [hovered, setHovered] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string>(layout.grid[0]?.[0] ?? '');

  // Encaja el mapa en el ancho disponible; por debajo de 0.72 se prefiere
  // desplazamiento horizontal a texto ilegible.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => setScale(Math.max(0.72, Math.min(1, entry.contentRect.width / layout.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [layout.width]);

  useEffect(() => {
    if (selectedNode) setFocusId(selectedNode);
  }, [selectedNode]);

  const visible = (c: ArchComponent) => activeLevels.has(c.confidence);
  const focusNode = hovered ?? selectedNode;
  const connected = useMemo(() => {
    const set = new Set<string>();
    if (!focusNode) return set;
    for (const r of relationships) if (r.source === focusNode || r.target === focusNode) set.add(r.id);
    return set;
  }, [focusNode, relationships]);
  const neighbors = useMemo(() => {
    const set = new Set<string>();
    for (const r of relationships) {
      if (connected.has(r.id)) {
        set.add(r.source);
        set.add(r.target);
      }
    }
    return set;
  }, [connected, relationships]);

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, id: string) {
    const box = layout.nodes.get(id)!;
    const { grid } = layout;
    let next: string | undefined;
    if (e.key === 'ArrowRight') next = grid[box.row][box.col + 1];
    if (e.key === 'ArrowLeft') next = grid[box.row][box.col - 1];
    if (e.key === 'Home') next = grid[box.row][0];
    if (e.key === 'End') next = grid[box.row].at(-1);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const row = grid[box.row + (e.key === 'ArrowDown' ? 1 : -1)];
      if (row) {
        const cx = box.x + NODE_W / 2;
        next = [...row].sort((a, b) => Math.abs(layout.nodes.get(a)!.x + NODE_W / 2 - cx) - Math.abs(layout.nodes.get(b)!.x + NODE_W / 2 - cx))[0];
      }
    }
    if (!next) return;
    e.preventDefault();
    setFocusId(next);
    nodeRefs.current.get(next)?.focus();
  }

  const edgeState = (r: ArchRelationship) => {
    const shown = activeLevels.has(r.confidence) && visible(components.get(r.source)!) && visible(components.get(r.target)!);
    if (flow) return flow.edges.has(r.id) ? 'active' : 'dim';
    if (selectedEdge === r.id || hoveredEdge === r.id || connected.has(r.id)) return 'active';
    if (!shown) return 'hidden';
    return focusNode || selectedEdge ? 'dim' : 'idle';
  };

  return (
    <div ref={wrapperRef} className="relative w-full overflow-x-auto overscroll-x-contain" style={{ height: layout.height * scale + 4 }}>
      <div className="relative origin-top-left" style={{ width: layout.width, height: layout.height, transform: `scale(${scale})` }}>
        {layout.rows.map((row) => (
          <div key={row.id} className="pointer-events-none absolute left-0 right-0 flex items-center gap-3" style={{ top: row.y }}>
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/40 whitespace-nowrap">{row.name}</span>
            <span className="h-px flex-1 bg-white/[0.07]" />
          </div>
        ))}

        <svg className="absolute inset-0 overflow-visible" width={layout.width} height={layout.height} aria-hidden="true">
          <defs>
            {[
              ['idle', 'rgba(255,255,255,0.35)'],
              ['dim', 'rgba(255,255,255,0.12)'],
              ['active', ACTIVE],
            ].map(([id, color]) => (
              <marker key={id} id={`sm-arrow-${id}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L8,4 L0,8 z" fill={color} />
              </marker>
            ))}
          </defs>
          {relationships.map((r) => {
            const path = layout.edges.get(r.id)!;
            const state = edgeState(r);
            if (state === 'hidden') return null;
            const stroke = state === 'active' ? ACTIVE : state === 'dim' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.28)';
            return (
              <g key={r.id}>
                <path
                  d={path.d}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={state === 'active' ? 2 : 1.25}
                  strokeDasharray={EDGE_DASH[r.confidence]}
                  markerEnd={`url(#sm-arrow-${state === 'active' ? 'active' : state === 'dim' ? 'dim' : 'idle'})`}
                />
                {/* Zona de clic generosa; el acceso por teclado está en la lista de relaciones. */}
                <path d={path.d} fill="none" stroke="transparent" strokeWidth={14} className="cursor-pointer" style={{ pointerEvents: 'stroke' }} onClick={() => onSelectEdge(r.id)} onMouseEnter={() => setHoveredEdge(r.id)} onMouseLeave={() => setHoveredEdge(null)}>
                  <title>{`${components.get(r.source)?.name} → ${components.get(r.target)?.name}: ${r.label}`}</title>
                </path>
              </g>
            );
          })}
        </svg>

        {/* Números de paso en un flujo; fuera de él, solo la etiqueta de la
            arista seleccionada o bajo el cursor (las demás se leen en el panel). */}
        {relationships.map((r) => {
          const labelled = flow ? flow.edges.has(r.id) : r.id === selectedEdge || r.id === hoveredEdge;
          if (!labelled) return null;
          const { mid } = layout.edges.get(r.id)!;
          const text = flow ? flow.edges.get(r.id) : r.label;
          if (!text) return null;
          return (
            <span
              key={r.id}
              className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap border border-black bg-accent-lime font-mono font-bold text-ink-950 shadow-[2px_2px_0_0_#000] ${flow ? 'px-1.5 py-0.5 text-[11px]' : 'max-w-[220px] truncate px-1.5 py-0.5 text-[10px]'}`}
              style={{ left: mid.x, top: mid.y }}
            >
              {text}
            </span>
          );
        })}

        {[...layout.nodes.values()].map((box) => {
          const c = components.get(box.id)!;
          const type = COMPONENT_TYPE[c.type];
          const selected = selectedNode === c.id;
          const inFlow = flow ? flow.components.has(c.id) : true;
          const faded = !visible(c) || !inFlow || (focusNode !== null && !neighbors.has(c.id) && focusNode !== c.id && !flow);
          const outside = c.type === 'external';
          const conf = CONFIDENCE[c.confidence];
          return (
            <button
              key={c.id}
              type="button"
              ref={(el) => {
                if (el) nodeRefs.current.set(c.id, el);
                else nodeRefs.current.delete(c.id);
              }}
              tabIndex={focusId === c.id ? 0 : -1}
              aria-pressed={selected}
              aria-label={`${c.name}. ${type.label}. ${conf.label}.`}
              onClick={(e) => onSelectNode(c.id, e.currentTarget)}
              onKeyDown={(e) => onKeyDown(e, c.id)}
              onFocus={() => setFocusId(c.id)}
              onMouseEnter={() => setHovered(c.id)}
              onMouseLeave={() => setHovered(null)}
              className={`group absolute flex flex-col justify-center gap-1 border-2 px-3 text-left transition-[opacity,box-shadow,transform] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lime ${
                outside ? 'border-dashed bg-ink-950/80' : 'bg-ink-900'
              } ${selected ? '-translate-x-0.5 -translate-y-0.5' : 'hover:-translate-y-0.5'} ${faded ? 'opacity-30' : 'opacity-100'}`}
              style={{
                left: box.x,
                top: box.y,
                width: NODE_W,
                height: NODE_H,
                borderColor: selected ? type.color : outside ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.16)',
                boxShadow: selected ? `4px 4px 0 0 ${type.color}` : undefined,
              }}
            >
              <span className="flex items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.2em]">
                <span className="flex items-center gap-1.5 text-white/50">
                  <span className="inline-block h-1.5 w-1.5" style={{ backgroundColor: type.color }} aria-hidden="true" />
                  {type.label}
                </span>
                <span className={conf.className} aria-hidden="true" title={conf.label}>
                  {conf.glyph}
                </span>
              </span>
              <span className="line-clamp-2 font-display text-[14px] font-semibold leading-[1.15] text-white">{c.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
