import type { ReactNode } from 'react';
import type { ArchComponent, ArchRelationship, Architecture, FlowStep } from '@/lib/system-map/types';
import { COMPONENT_TYPE, ConfidenceBadge, EvidenceList, RELATIONSHIP_TYPE, track } from './shared';

type Common = {
  ir: Architecture;
  components: Map<string, ArchComponent>;
  onSelectNode: (id: string) => void;
  onSelectEdge: (id: string) => void;
};

const treeUrl = (ir: Architecture, path: string) =>
  `${ir.source.url}/${/\.[a-z0-9]+$/i.test(path) || path.endsWith('Dockerfile') ? 'blob' : 'tree'}/${ir.source.commit}/${path}`;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="label-mono mb-2.5">{title}</h3>
      {children}
    </section>
  );
}

function Caveat({ text }: { text: string }) {
  return (
    <p className="mt-4 border-l-2 border-accent-amber bg-accent-amber/[0.06] px-3 py-2 text-sm leading-relaxed text-white/80">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-amber">Límite de la evidencia · </span>
      {text}
    </p>
  );
}

export function RelationRow({ r, direction, components, onSelectEdge }: { r: ArchRelationship; direction: 'in' | 'out' | 'both'; components: Map<string, ArchComponent>; onSelectEdge: (id: string) => void }) {
  const source = components.get(r.source)?.name;
  const target = components.get(r.target)?.name;
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelectEdge(r.id)}
        className="group flex w-full items-start gap-3 border border-white/10 bg-white/[0.03] px-3 py-2 text-left transition hover:border-white/30 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-lime"
      >
        <span className="mt-0.5 font-mono text-xs text-white/40" aria-hidden="true">
          {direction === 'in' ? '←' : direction === 'out' ? '→' : '·'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-white/90">
            {direction === 'in' ? source : direction === 'out' ? target : `${source} → ${target}`}
          </span>
          <span className="block truncate text-xs text-white/50">{r.label}</span>
        </span>
        <span className="flex flex-col items-end gap-1">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/45">{RELATIONSHIP_TYPE[r.type]}</span>
          <ConfidenceBadge level={r.confidence} compact />
        </span>
      </button>
    </li>
  );
}

export function NodeDetail({ c, ir, components, onSelectEdge }: Common & { c: ArchComponent }) {
  const incoming = ir.relationships.filter((r) => r.target === c.id);
  const outgoing = ir.relationships.filter((r) => r.source === c.id);
  const type = COMPONENT_TYPE[c.type];
  return (
    <div>
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">
        <span className="inline-block h-2 w-2" style={{ backgroundColor: type.color }} aria-hidden="true" />
        {type.label}
      </div>
      <p className="mt-3 text-white/85 leading-relaxed">{c.summary}</p>
      {c.role && <p className="mt-2 text-sm text-white/60 leading-relaxed">{c.role}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <ConfidenceBadge level={c.confidence} />
        {c.metrics.files > 0 && (
          <span className="font-mono text-[11px] text-white/50">
            {c.metrics.files} archivos · {c.metrics.lines.toLocaleString('es-CO')} líneas
            {c.metrics.routes ? ` · ${c.metrics.routes} rutas` : ''}
          </span>
        )}
      </div>
      {c.caveat && <Caveat text={c.caveat} />}
      {c.technologies.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {c.technologies.map((t) => (
            <span key={t} className="chip">{t}</span>
          ))}
        </div>
      )}

      <Section title={`Depende de · ${outgoing.length}`}>
        {outgoing.length ? (
          <ul className="grid gap-1.5">{outgoing.map((r) => <RelationRow key={r.id} r={r} direction="out" components={components} onSelectEdge={onSelectEdge} />)}</ul>
        ) : (
          <p className="text-sm text-white/45">Sin dependencias salientes.</p>
        )}
      </Section>
      <Section title={`Lo usan · ${incoming.length}`}>
        {incoming.length ? (
          <ul className="grid gap-1.5">{incoming.map((r) => <RelationRow key={r.id} r={r} direction="in" components={components} onSelectEdge={onSelectEdge} />)}</ul>
        ) : (
          <p className="text-sm text-white/45">Nada en el sistema depende de este componente.</p>
        )}
      </Section>

      <Section title="Evidencia">
        <EvidenceList evidence={c.evidence} context={`node:${c.id}`} />
      </Section>

      {c.paths.length > 0 && (
        <a
          href={treeUrl(ir, c.paths[0])}
          target="_blank"
          rel="noreferrer"
          onClick={() => track('github_opened', { context: `node:${c.id}` })}
          className="btn-ghost mt-6 !px-4 !py-2.5 text-xs"
        >
          Abrir en el repositorio ↗
        </a>
      )}
    </div>
  );
}

export function EdgeDetail({ r, components, onSelectNode }: Common & { r: ArchRelationship }) {
  const source = components.get(r.source)!;
  const target = components.get(r.target)!;
  const endpoint = (c: ArchComponent) => (
    <button
      type="button"
      onClick={() => onSelectNode(c.id)}
      className="border-2 border-white/20 bg-ink-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:border-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-lime"
    >
      {c.name}
    </button>
  );
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">Relación · {RELATIONSHIP_TYPE[r.type]}</div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {endpoint(source)}
        <span className="font-mono text-white/50" aria-label="hacia">→</span>
        {endpoint(target)}
      </div>
      {r.description && <p className="mt-4 text-white/80 leading-relaxed">{r.description}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <ConfidenceBadge level={r.confidence} />
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
          {r.detected ? 'Detectada por análisis estático' : 'Declarada en la interpretación'}
        </span>
      </div>
      {r.caveat && <Caveat text={r.caveat} />}
      {r.endpoints && r.endpoints.length > 0 && (
        <Section title={r.type === 'sql' ? 'Tablas y RPC' : 'Endpoints'}>
          <ul className="flex flex-wrap gap-1.5">
            {r.endpoints.map((e) => (
              <li key={e} className="border border-white/10 bg-black/30 px-2 py-1 font-mono text-[11px] text-white/75">{e}</li>
            ))}
          </ul>
        </Section>
      )}
      <Section title="Evidencia">
        <EvidenceList evidence={r.evidence} context={`edge:${r.id}`} />
      </Section>
    </div>
  );
}

export function StepDetail({ step, index, components, ir, onSelectNode, onSelectEdge }: Common & { step: FlowStep; index: number }) {
  const rel = step.relationship ? ir.relationships.find((r) => r.id === step.relationship) : undefined;
  const comp = step.component ? components.get(step.component) : undefined;
  // Evidencia del paso + la de lo que referencia, sin duplicados.
  const evidence = [...step.evidence, ...(rel?.evidence ?? [])].filter((e, i, all) => all.findIndex((x) => x.url === e.url) === i);
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">Paso {index + 1}</div>
      {step.detail && <p className="mt-3 text-white/80 leading-relaxed">{step.detail}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ConfidenceBadge level={step.confidence} />
      </div>
      {(rel || comp) && (
        <Section title="En el mapa">
          <ul className="grid gap-1.5">
            {rel && <RelationRow r={rel} direction="both" components={components} onSelectEdge={onSelectEdge} />}
            {comp && (
              <li>
                <button
                  type="button"
                  onClick={() => onSelectNode(comp.id)}
                  className="w-full border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-sm text-white/90 transition hover:border-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-lime"
                >
                  {comp.name} <span className="text-white/45">· {COMPONENT_TYPE[comp.type].label}</span>
                </button>
              </li>
            )}
          </ul>
        </Section>
      )}
      <Section title="Evidencia">
        <EvidenceList evidence={evidence} context={`step:${step.id}`} />
      </Section>
    </div>
  );
}
