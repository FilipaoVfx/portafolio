import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { computeLayout } from '@/lib/system-map/layout';
import type { ArchComponent, Architecture, Confidence, Flow } from '@/lib/system-map/types';
import { EdgeDetail, NodeDetail, RelationRow, StepDetail } from './DetailPanel';
import MapCanvas from './MapCanvas';
import { BASIS, COMPONENT_TYPE, CONFIDENCE, CONFIDENCE_ORDER, ConfidenceBadge, EDGE_DASH, EvidenceList, track } from './shared';

type View = 'architecture' | 'runtime' | 'data' | 'decisions';
type Selection = { kind: 'node' | 'edge'; id: string } | { kind: 'step'; id: string } | null;

const VIEWS: { id: View; label: string }[] = [
  { id: 'architecture', label: 'Arquitectura' },
  { id: 'runtime', label: 'Runtime' },
  { id: 'data', label: 'Flujo de datos' },
  { id: 'decisions', label: 'Decisiones' },
];

function readHash() {
  if (typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.hash.replace(/^#/, ''));
}

function useIsDesktop() {
  const [desktop, setDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return desktop;
}

export default function SystemMap({ ir }: { ir: Architecture }) {
  const layout = useMemo(() => computeLayout(ir), [ir]);
  const components = useMemo(() => new Map(ir.components.map((c) => [c.id, c])), [ir]);
  const runtimeFlows = ir.flows.filter((f) => f.kind === 'runtime');
  const dataFlows = ir.flows.filter((f) => f.kind === 'data');

  const [view, setView] = useState<View>('architecture');
  const [flowId, setFlowId] = useState(runtimeFlows[0]?.id ?? '');
  const [selection, setSelection] = useState<Selection>(null);
  const [levels, setLevels] = useState<Set<Confidence>>(new Set(CONFIDENCE_ORDER));
  const isDesktop = useIsDesktop();

  const returnFocus = useRef<HTMLElement | null>(null);
  const panelHeading = useRef<HTMLHeadingElement>(null);

  // Estado compartible por URL: #view=runtime&flow=goal&node=api
  useEffect(() => {
    const h = readHash();
    const v = h.get('view') as View | null;
    if (v && VIEWS.some((x) => x.id === v)) setView(v);
    const f = h.get('flow');
    if (f && runtimeFlows.some((x) => x.id === f)) setFlowId(f);
    const node = h.get('node');
    const edge = h.get('edge');
    if (node && components.has(node)) setSelection({ kind: 'node', id: node });
    else if (edge && ir.relationships.some((r) => r.id === edge)) setSelection({ kind: 'edge', id: edge });
    track('system_map_open', { project: ir.project.slug });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const h = new URLSearchParams();
    if (view !== 'architecture') h.set('view', view);
    if (view === 'runtime' && flowId) h.set('flow', flowId);
    if (selection?.kind === 'node') h.set('node', selection.id);
    if (selection?.kind === 'edge') h.set('edge', selection.id);
    const hash = h.toString();
    const url = `${window.location.pathname}${window.location.search}${hash ? `#${hash}` : ''}`;
    window.history.replaceState(null, '', url);
  }, [view, flowId, selection]);

  const close = useCallback(() => {
    setSelection(null);
    const target = returnFocus.current;
    returnFocus.current = null;
    if (target?.isConnected) requestAnimationFrame(() => target.focus());
  }, []);

  useEffect(() => {
    if (!selection) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selection, close]);

  // En móvil el detalle abre como bottom sheet: el foco entra al panel.
  useEffect(() => {
    if (selection && !isDesktop) panelHeading.current?.focus();
  }, [selection, isDesktop]);

  const rememberTrigger = () => {
    if (!returnFocus.current && document.activeElement instanceof HTMLElement) returnFocus.current = document.activeElement;
  };
  const selectNode = (id: string, trigger?: HTMLElement) => {
    if (trigger) returnFocus.current = trigger;
    else rememberTrigger();
    setSelection({ kind: 'node', id });
    track('node_selected', { node: id });
  };
  const selectEdge = (id: string) => {
    rememberTrigger();
    setSelection({ kind: 'edge', id });
    track('relationship_selected', { relationship: id });
  };
  const selectStep = (id: string) => {
    rememberTrigger();
    setSelection({ kind: 'step', id });
  };
  const changeView = (v: View) => {
    setView(v);
    setSelection(null);
    track('architecture_mode_changed', { mode: v });
  };
  const toggleLevel = (level: Confidence) => {
    setLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level) && next.size > 1) next.delete(level);
      else next.add(level);
      return next;
    });
  };

  const flow = runtimeFlows.find((f) => f.id === flowId) ?? runtimeFlows[0];
  const flowHighlight = useMemo(() => {
    if (view !== 'runtime' || !flow) return null;
    const comps = new Set<string>();
    const edges = new Map<string, string>();
    flow.steps.forEach((s, i) => {
      if (s.component) comps.add(s.component);
      if (s.relationship) {
        const r = ir.relationships.find((x) => x.id === s.relationship);
        if (r) {
          comps.add(r.source);
          comps.add(r.target);
        }
        edges.set(s.relationship, edges.has(s.relationship) ? `${edges.get(s.relationship)}·${i + 1}` : String(i + 1));
      }
    });
    return { components: comps, edges };
  }, [view, flow, ir.relationships]);

  const counts = useMemo(() => {
    const out: Record<Confidence, number> = { confirmed: 0, supported: 0, inferred: 0, unknown: 0 };
    for (const el of [...ir.components, ...ir.relationships]) out[el.confidence] += 1;
    return out;
  }, [ir]);

  const selectedNode = selection?.kind === 'node' ? components.get(selection.id) : undefined;
  const selectedEdge = selection?.kind === 'edge' ? ir.relationships.find((r) => r.id === selection.id) : undefined;
  const selectedStepIndex = selection?.kind === 'step' && flow ? flow.steps.findIndex((s) => s.id === selection.id) : -1;
  const selectedStep = selectedStepIndex >= 0 ? flow!.steps[selectedStepIndex] : undefined;
  const hasDetail = Boolean(selectedNode || selectedEdge || selectedStep);
  const panelTitle = selectedNode?.name ?? (selectedEdge ? selectedEdge.label : selectedStep?.label) ?? '';

  const common = {
    ir,
    components,
    onSelectNode: (id: string) => selectNode(id),
    onSelectEdge: selectEdge,
  };

  const detail = hasDetail && (
    <div>
      <div className="flex items-start justify-between gap-3">
        <h2 id="sm-panel-title" ref={panelHeading} tabIndex={-1} className="heading-display text-2xl leading-tight outline-none">
          {panelTitle}
        </h2>
        <button
          type="button"
          onClick={close}
          className="shrink-0 border border-white/20 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/70 transition hover:border-white/50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-lime"
        >
          Cerrar <span className="text-white/40">esc</span>
        </button>
      </div>
      <div className="mt-2">
        {selectedNode && <NodeDetail {...common} c={selectedNode} />}
        {selectedEdge && <EdgeDetail {...common} r={selectedEdge} />}
        {selectedStep && <StepDetail {...common} step={selectedStep} index={selectedStepIndex} />}
      </div>
    </div>
  );

  const legend = (
    <div>
      <h2 className="label-mono">Confianza</h2>
      <p className="mt-2 text-sm text-white/55 leading-relaxed">Filtra el mapa por el tipo de evidencia que respalda cada elemento.</p>
      <div className="mt-3 grid gap-1.5" role="group" aria-label="Filtrar por confianza">
        {CONFIDENCE_ORDER.map((level) => {
          const c = CONFIDENCE[level];
          const on = levels.has(level);
          return (
            <button
              key={level}
              type="button"
              aria-pressed={on}
              onClick={() => toggleLevel(level)}
              disabled={counts[level] === 0}
              className={`flex items-center gap-3 border px-3 py-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-lime disabled:cursor-not-allowed disabled:opacity-35 ${
                on ? 'border-white/25 bg-white/[0.05]' : 'border-white/10 bg-transparent opacity-60'
              }`}
            >
              <span className={`w-4 text-center ${c.className}`} aria-hidden="true">{c.glyph}</span>
              <span className="flex-1">
                <span className="block text-sm text-white/90">{c.label}</span>
                <span className="block text-xs text-white/45">{c.hint}</span>
              </span>
              <svg width="28" height="6" aria-hidden="true" className="shrink-0">
                <line x1="0" y1="3" x2="28" y2="3" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeDasharray={EDGE_DASH[level]} />
              </svg>
              <span className="w-6 text-right font-mono text-xs text-white/50">{counts[level]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const relationList = (
    <div className="mt-8">
      <h2 className="label-mono">Relaciones · {ir.relationships.length}</h2>
      <ul className="mt-3 grid max-h-[420px] gap-1.5 overflow-y-auto pr-1">
        {ir.relationships
          .filter((r) => levels.has(r.confidence))
          .map((r) => (
            <RelationRow key={r.id} r={r} direction="both" components={components} onSelectEdge={selectEdge} />
          ))}
      </ul>
    </div>
  );

  const stepsList = flow && (
    <div>
      {runtimeFlows.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-1.5" role="group" aria-label="Flujo runtime">
          {runtimeFlows.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={f.id === flow.id}
              onClick={() => {
                setFlowId(f.id);
                setSelection(null);
              }}
              className={`border-2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-lime ${
                f.id === flow.id ? 'border-black bg-accent-lime text-ink-950 shadow-[3px_3px_0_0_#000]' : 'border-white/20 text-white/70 hover:border-white/50'
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}
      <h2 className="heading-display text-xl">{flow.name}</h2>
      {flow.summary && <p className="mt-1 text-sm text-white/55">{flow.summary}</p>}
      <ol className="mt-4 grid gap-1.5">
        {flow.steps.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => selectStep(s.id)}
              className="flex w-full items-start gap-3 border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left transition hover:border-white/30 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-lime"
            >
              <span className="min-w-[1.5rem] font-mono text-sm font-bold text-accent-lime">{String(i + 1).padStart(2, '0')}</span>
              <span className="flex-1">
                <span className="block text-sm text-white/90">{s.label}</span>
                {s.detail && <span className="mt-0.5 block text-xs leading-relaxed text-white/50">{s.detail}</span>}
              </span>
              <ConfidenceBadge level={s.confidence} compact />
            </button>
          </li>
        ))}
      </ol>
    </div>
  );

  const mapView = (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="min-w-0">
        {/* ≥640px: grafo. En móvil: índice por capas, misma selección y detalle. */}
        <div className="hidden sm:block">
          <MapCanvas
            layout={layout}
            components={components}
            relationships={ir.relationships}
            selectedNode={selectedNode?.id ?? null}
            selectedEdge={selectedEdge?.id ?? (selectedStep?.relationship ?? null)}
            activeLevels={levels}
            flow={flowHighlight}
            onSelectNode={selectNode}
            onSelectEdge={selectEdge}
          />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
            Flechas para moverte entre componentes · Enter para abrir · Esc para cerrar
          </p>
        </div>
        <MobileIndex ir={ir} layout={layout.grid} components={components} levels={levels} highlight={flowHighlight?.components} selected={selectedNode?.id} onSelect={selectNode} />
      </div>

      <aside
        aria-label="Detalle"
        className={
          hasDetail && !isDesktop
            ? 'fixed inset-x-0 bottom-0 z-[60] max-h-[78vh] overflow-y-auto border-t-2 border-white/80 bg-ink-950 px-4 pb-8 pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.6)]'
            : 'glass-strong border-2 border-white/10 p-5 lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto'
        }
        role={hasDetail && !isDesktop ? 'dialog' : undefined}
        aria-labelledby={hasDetail && !isDesktop ? 'sm-panel-title' : undefined}
      >
        {hasDetail && !isDesktop && <div className="mx-auto mb-3 h-1 w-10 bg-white/25" aria-hidden="true" />}
        {hasDetail ? detail : view === 'runtime' ? stepsList : (
          <>
            {legend}
            {relationList}
          </>
        )}
      </aside>
      {hasDetail && !isDesktop && view === 'runtime' && <div className="lg:hidden">{stepsList}</div>}
      {hasDetail && !isDesktop && view === 'architecture' && (
        <div className="lg:hidden">
          {legend}
          {relationList}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div role="tablist" aria-label="Vistas del sistema" className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            id={`sm-tab-${v.id}`}
            type="button"
            role="tab"
            aria-selected={view === v.id}
            aria-controls="sm-view"
            onClick={() => changeView(v.id)}
            onKeyDown={(e) => {
              const i = VIEWS.findIndex((x) => x.id === v.id);
              const next = e.key === 'ArrowRight' ? VIEWS[(i + 1) % VIEWS.length] : e.key === 'ArrowLeft' ? VIEWS[(i - 1 + VIEWS.length) % VIEWS.length] : null;
              if (!next) return;
              e.preventDefault();
              changeView(next.id);
              document.getElementById(`sm-tab-${next.id}`)?.focus();
            }}
            tabIndex={view === v.id ? 0 : -1}
            className={`border-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lime ${
              view === v.id ? 'border-black bg-accent-lime text-ink-950 shadow-[3px_3px_0_0_#000]' : 'border-white/20 bg-white/[0.03] text-white/70 hover:border-white/50 hover:text-white'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div id="sm-view" role="tabpanel" aria-labelledby={`sm-tab-${view}`} className="pt-6">
        {(view === 'architecture' || view === 'runtime') && mapView}
        {view === 'data' && dataFlows.map((f) => <DataFlow key={f.id} flow={f} components={components} onSelectNode={(id) => {
          changeView('architecture');
          selectNode(id);
        }} />)}
        {view === 'decisions' && <Decisions ir={ir} components={components} />}
      </div>
    </div>
  );
}

function MobileIndex({ ir, layout, components, levels, highlight, selected, onSelect }: {
  ir: Architecture;
  layout: string[][];
  components: Map<string, ArchComponent>;
  levels: Set<Confidence>;
  highlight?: Set<string>;
  selected?: string;
  onSelect: (id: string, trigger: HTMLElement) => void;
}) {
  const groupName = new Map(ir.groups.map((g) => [g.id, g.name]));
  const degree = (id: string) => ir.relationships.filter((r) => r.source === id || r.target === id).length;
  return (
    <div className="grid gap-5 sm:hidden">
      {layout.map((row) => {
        const group = components.get(row[0])!.group;
        return (
          <section key={group}>
            <h3 className="label-mono mb-2">{groupName.get(group)}</h3>
            <ul className="grid gap-1.5">
              {row.map((id) => {
                const c = components.get(id)!;
                const dim = !levels.has(c.confidence) || (highlight && !highlight.has(id));
                return (
                  <li key={id}>
                    <button
                      type="button"
                      aria-pressed={selected === id}
                      onClick={(e) => onSelect(id, e.currentTarget)}
                      className={`flex w-full items-center gap-3 border-2 bg-ink-900 px-3 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-lime ${
                        c.type === 'external' ? 'border-dashed' : ''
                      } ${dim ? 'opacity-40' : ''}`}
                      style={{ borderColor: selected === id ? COMPONENT_TYPE[c.type].color : 'rgba(255,255,255,0.14)' }}
                    >
                      <span className="inline-block h-2 w-2 shrink-0" style={{ backgroundColor: COMPONENT_TYPE[c.type].color }} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-white">{c.name}</span>
                        <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
                          {COMPONENT_TYPE[c.type].label} · {degree(id)} relaciones
                        </span>
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

function DataFlow({ flow, components, onSelectNode }: { flow: Flow; components: Map<string, ArchComponent>; onSelectNode: (id: string) => void }) {
  return (
    <section className="mx-auto max-w-3xl">
      <h2 className="heading-display text-2xl md:text-3xl">{flow.name}</h2>
      {flow.summary && <p className="mt-2 text-white/60">{flow.summary}</p>}
      <ol className="relative mt-8 grid gap-0">
        {flow.steps.map((s, i) => {
          const c = s.component ? components.get(s.component) : undefined;
          const last = i === flow.steps.length - 1;
          return (
            <li key={s.id} className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4">
              <div className="flex flex-col items-center">
                <span className="grid h-10 w-10 shrink-0 place-items-center border-2 border-black bg-accent-lime font-mono text-sm font-bold text-ink-950 shadow-[3px_3px_0_0_#000]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {!last && <span className="w-px flex-1 bg-white/20" aria-hidden="true" />}
              </div>
              <div className={last ? 'pb-2' : 'pb-8'}>
                {s.artifact && <div className="font-mono text-xs text-accent-electric">{s.artifact}</div>}
                <h3 className="heading-display mt-1 text-lg">{s.label}</h3>
                {s.detail && <p className="mt-1 text-sm leading-relaxed text-white/65">{s.detail}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {c && (
                    <button
                      type="button"
                      onClick={() => onSelectNode(c.id)}
                      className="chip transition hover:border-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-lime"
                    >
                      <span className="inline-block h-1.5 w-1.5" style={{ backgroundColor: COMPONENT_TYPE[c.type].color }} aria-hidden="true" />
                      {c.name} →
                    </button>
                  )}
                  <ConfidenceBadge level={s.confidence} />
                </div>
                {s.evidence.length > 0 && (
                  <details className="mt-3 group">
                    <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.18em] text-white/45 hover:text-white/80">
                      Evidencia · {s.evidence.length}
                    </summary>
                    <div className="mt-2">
                      <EvidenceList evidence={s.evidence} context={`data:${s.id}`} />
                    </div>
                  </details>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Decisions({ ir, components }: { ir: Architecture; components: Map<string, ArchComponent> }) {
  const [basis, setBasis] = useState<keyof typeof BASIS | 'all'>('all');
  const shown = ir.decisions.filter((d) => basis === 'all' || d.basis === basis);
  return (
    <section>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar decisiones por origen">
        {(['all', 'observed', 'documented', 'inferred'] as const).map((b) => {
          const n = b === 'all' ? ir.decisions.length : ir.decisions.filter((d) => d.basis === b).length;
          return (
            <button
              key={b}
              type="button"
              aria-pressed={basis === b}
              onClick={() => setBasis(b)}
              disabled={n === 0}
              className={`border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-lime disabled:opacity-35 ${
                basis === b ? 'border-white/60 bg-white/10 text-white' : 'border-white/15 text-white/60 hover:border-white/40'
              }`}
            >
              {b === 'all' ? 'Todas' : `${BASIS[b].glyph} ${BASIS[b].label}`} · {n}
            </button>
          );
        })}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {shown.map((d) => (
          <article key={d.id} className="glass-strong flex flex-col border border-white/15 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/55" title={BASIS[d.basis].hint}>
                <span aria-hidden="true">{BASIS[d.basis].glyph} </span>
                {BASIS[d.basis].label}
              </span>
              <ConfidenceBadge level={d.confidence} />
            </div>
            <h3 className="heading-display mt-3 text-lg leading-snug">{d.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{d.why}</p>
            {d.caveat && <p className="mt-2 text-sm text-accent-amber/90">{d.caveat}</p>}
            {d.components.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {d.components.map((id) => (
                  <span key={id} className="chip">{components.get(id)?.name ?? id}</span>
                ))}
              </div>
            )}
            <details className="mt-4">
              <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.18em] text-white/45 hover:text-white/80">
                Evidencia · {d.evidence.length}
              </summary>
              <div className="mt-2">
                <EvidenceList evidence={d.evidence} context={`decision:${d.id}`} />
              </div>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}
