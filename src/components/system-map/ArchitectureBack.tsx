import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { computeLayout } from '@/lib/system-map/layout';
import type { ArchComponent, Architecture, Confidence } from '@/lib/system-map/types';
import { EdgeDetail, NodeDetail, StepDetail } from './DetailPanel';
import MapCanvas from './MapCanvas';
import { BASIS, COMPONENT_TYPE, CONFIDENCE, CONFIDENCE_ORDER, ConfidenceBadge, EvidenceList, track } from './shared';

// Reverso de la tarjeta de proyecto: el mapa es el protagonista. Todo lo
// demás (detalle, evidencia, flujos, decisiones) aparece solo si se pide.

type View = 'map' | 'flows' | 'decisions';
type Selection = { kind: 'node' | 'edge' | 'step'; id: string } | null;

const VIEWS: { id: View; label: string }[] = [
  { id: 'map', label: 'Mapa' },
  { id: 'flows', label: 'Flujos' },
  { id: 'decisions', label: 'Decisiones' },
];

const ALL_LEVELS = new Set<Confidence>(CONFIDENCE_ORDER);

export default function ArchitectureBack({ ir }: { ir: Architecture }) {
  const layout = useMemo(() => computeLayout(ir), [ir]);
  const components = useMemo(() => new Map(ir.components.map((c) => [c.id, c])), [ir]);
  const [view, setView] = useState<View>('map');
  const [flowId, setFlowId] = useState(ir.flows[0]?.id ?? '');
  const [selection, setSelection] = useState<Selection>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const detailHeading = useRef<HTMLHeadingElement>(null);

  const flow = ir.flows.find((f) => f.id === flowId) ?? ir.flows[0];
  const highlight = useMemo(() => {
    if (view !== 'flows' || !flow) return null;
    const comps = new Set<string>();
    const edges = new Map<string, string>();
    flow.steps.forEach((s, i) => {
      if (s.component) comps.add(s.component);
      const r = s.relationship ? ir.relationships.find((x) => x.id === s.relationship) : undefined;
      if (r) {
        comps.add(r.source);
        comps.add(r.target);
        edges.set(r.id, edges.has(r.id) ? `${edges.get(r.id)}·${i + 1}` : String(i + 1));
      }
    });
    return { components: comps, edges };
  }, [view, flow, ir.relationships]);

  const open = (next: Selection, trigger?: HTMLElement | null) => {
    returnFocus.current = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setSelection(next);
    if (next?.kind === 'node') track('node_selected', { project: ir.project.slug, node: next.id });
    if (next?.kind === 'edge') track('relationship_selected', { project: ir.project.slug, relationship: next.id });
    requestAnimationFrame(() => detailHeading.current?.focus());
  };
  const close = () => {
    setSelection(null);
    const target = returnFocus.current;
    returnFocus.current = null;
    if (target?.isConnected) requestAnimationFrame(() => target.focus());
  };
  const changeView = (v: View) => {
    setView(v);
    setSelection(null);
    track('architecture_mode_changed', { project: ir.project.slug, mode: v });
  };

  // Escape cierra primero el detalle; si no hay detalle, sube a la tarjeta
  // (que se da la vuelta).
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && selection) {
      e.stopPropagation();
      close();
    }
  };

  const node = selection?.kind === 'node' ? components.get(selection.id) : undefined;
  const edge = selection?.kind === 'edge' ? ir.relationships.find((r) => r.id === selection.id) : undefined;
  const stepIndex = selection?.kind === 'step' && flow ? flow.steps.findIndex((s) => s.id === selection.id) : -1;
  const step = stepIndex >= 0 ? flow!.steps[stepIndex] : undefined;
  const title = node?.name ?? edge?.label ?? step?.label;
  const common = { ir, components, onSelectNode: (id: string) => open({ kind: 'node', id }), onSelectEdge: (id: string) => open({ kind: 'edge', id }) };

  const detail = title && (
    <div>
      <div className="flex items-start justify-between gap-3">
        <h4 ref={detailHeading} tabIndex={-1} className="heading-display text-xl leading-tight outline-none">{title}</h4>
        <button type="button" onClick={close} className="shrink-0 border border-white/20 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/65 transition hover:border-white/50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-lime">
          Cerrar
        </button>
      </div>
      <div className="mt-1">
        {node && <NodeDetail {...common} c={node} />}
        {edge && <EdgeDetail {...common} r={edge} />}
        {step && <StepDetail {...common} step={step} index={stepIndex} />}
      </div>
    </div>
  );

  const hint = (
    <div className="text-sm leading-relaxed text-white/55">
      <p>Pulsa un componente o una conexión para ver qué hace y las líneas de código que lo demuestran.</p>
      <ul className="mt-4 grid gap-2.5 font-mono text-[11px]">
        {CONFIDENCE_ORDER.slice(0, 3).map((level) => (
          <li key={level}>
            <span className={`inline-block w-4 ${CONFIDENCE[level].className}`} aria-hidden="true">{CONFIDENCE[level].glyph}</span>
            <span className="text-white/75">{CONFIDENCE[level].label}</span>
            <span className="block pl-4 font-sans text-xs text-white/40">{CONFIDENCE[level].hint}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const steps = flow && (
    <div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Flujo">
        {ir.flows.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={f.id === flow.id}
            onClick={() => {
              setFlowId(f.id);
              setSelection(null);
            }}
            className={`border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-lime ${
              f.id === flow.id ? 'border-accent-lime bg-accent-lime text-ink-950' : 'border-white/20 text-white/65 hover:border-white/50'
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>
      {flow.summary && <p className="mt-3 text-sm text-white/55">{flow.summary}</p>}
      <ol className="mt-3 grid gap-1">
        {flow.steps.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={(e) => open({ kind: 'step', id: s.id }, e.currentTarget)}
              className="flex w-full items-start gap-2.5 border border-transparent px-2 py-1.5 text-left transition hover:border-white/15 hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-lime"
            >
              <span className="min-w-[1.4rem] font-mono text-xs font-bold text-accent-lime">{String(i + 1).padStart(2, '0')}</span>
              <span className="flex-1 text-sm text-white/85">
                {s.label}
                {s.artifact && <span className="block font-mono text-[11px] text-accent-electric/80">{s.artifact}</span>}
              </span>
              <ConfidenceBadge level={s.confidence} compact />
            </button>
          </li>
        ))}
      </ol>
    </div>
  );

  return (
    <div className="relative" onKeyDown={onKeyDown}>
      <div role="tablist" aria-label={`Vistas de ${ir.project.name}`} className="flex gap-1">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={view === v.id}
            onClick={() => changeView(v.id)}
            className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-lime ${
              view === v.id ? 'text-white underline decoration-accent-lime decoration-2 underline-offset-[6px]' : 'text-white/45 hover:text-white/80'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'decisions' ? (
        <Decisions ir={ir} components={components} />
      ) : (
        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="min-w-0">
            <div className="hidden sm:block">
              <MapCanvas
                layout={layout}
                components={components}
                relationships={ir.relationships}
                selectedNode={node?.id ?? null}
                selectedEdge={edge?.id ?? step?.relationship ?? null}
                activeLevels={ALL_LEVELS}
                flow={highlight}
                onSelectNode={(id, trigger) => open({ kind: 'node', id }, trigger)}
                onSelectEdge={(id) => open({ kind: 'edge', id })}
              />
            </div>
            <LayerList ir={ir} grid={layout.grid} components={components} highlight={highlight?.components} selected={node?.id} onSelect={(id, t) => open({ kind: 'node', id }, t)} />
          </div>

          {/* En pantallas grandes el detalle vive a la derecha; en las
              pequeñas se superpone dentro de la misma tarjeta. */}
          <aside
            aria-label="Detalle"
            className={
              detail
                ? 'absolute inset-x-0 bottom-0 top-10 z-10 overflow-y-auto border-t-2 border-white/70 bg-ink-950 p-4 lg:static lg:max-h-[640px] lg:border lg:border-white/10 lg:bg-black/30'
                : 'border border-white/10 bg-black/20 p-4'
            }
          >
            {detail || (view === 'flows' ? steps : hint)}
          </aside>
        </div>
      )}

      <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
        Generado del código de{' '}
        <a
          href={`${ir.source.url}/tree/${ir.source.commit}`}
          target="_blank"
          rel="noreferrer"
          onClick={() => track('github_opened', { project: ir.project.slug })}
          className="text-white/55 underline decoration-white/20 underline-offset-4 hover:text-white"
        >
          {ir.source.repository}@{ir.source.commit.slice(0, 7)} ↗
        </a>
      </p>
    </div>
  );
}

function LayerList({ ir, grid, components, highlight, selected, onSelect }: {
  ir: Architecture;
  grid: string[][];
  components: Map<string, ArchComponent>;
  highlight?: Set<string>;
  selected?: string;
  onSelect: (id: string, trigger: HTMLElement) => void;
}) {
  const groupName = new Map(ir.groups.map((g) => [g.id, g.name]));
  return (
    <div className="grid gap-4 sm:hidden">
      {grid.map((row) => {
        const group = components.get(row[0])!.group;
        return (
          <section key={group}>
            <h5 className="label-mono mb-1.5">{groupName.get(group)}</h5>
            <ul className="grid gap-1">
              {row.map((id) => {
                const c = components.get(id)!;
                const dim = highlight && !highlight.has(id);
                return (
                  <li key={id}>
                    <button
                      type="button"
                      aria-pressed={selected === id}
                      onClick={(e) => onSelect(id, e.currentTarget)}
                      className={`flex w-full items-center gap-3 border-2 bg-ink-900 px-3 py-2.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-lime ${c.type === 'external' ? 'border-dashed' : ''} ${dim ? 'opacity-35' : ''}`}
                      style={{ borderColor: selected === id ? COMPONENT_TYPE[c.type].color : 'rgba(255,255,255,0.14)' }}
                    >
                      <span className="inline-block h-2 w-2 shrink-0" style={{ backgroundColor: COMPONENT_TYPE[c.type].color }} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-white">{c.name}</span>
                        <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">{COMPONENT_TYPE[c.type].label}</span>
                      </span>
                      <ConfidenceBadge level={c.confidence} compact />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function Decisions({ ir, components }: { ir: Architecture; components: Map<string, ArchComponent> }) {
  return (
    <ul className="mt-4 grid gap-3 md:grid-cols-2">
      {ir.decisions.map((d) => (
        <li key={d.id} className="border border-white/10 bg-black/25 p-4">
          <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">
            <span title={BASIS[d.basis].hint}>
              <span aria-hidden="true">{BASIS[d.basis].glyph} </span>
              {BASIS[d.basis].label}
            </span>
            <ConfidenceBadge level={d.confidence} compact />
          </div>
          <h4 className="heading-display mt-2 text-base leading-snug">{d.title}</h4>
          <p className="mt-1.5 text-sm leading-relaxed text-white/65">{d.why}</p>
          {d.components.length > 0 && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
              {d.components.map((id) => components.get(id)?.name ?? id).join(' · ')}
            </p>
          )}
          <details className="mt-3">
            <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.18em] text-white/45 hover:text-white/80">
              Evidencia · {d.evidence.length}
            </summary>
            <div className="mt-2">
              <EvidenceList evidence={d.evidence} context={`decision:${d.id}`} />
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}
