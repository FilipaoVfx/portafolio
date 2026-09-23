import type { ComponentType, Confidence, Evidence, EvidenceType, RelationshipType } from '@/lib/system-map/types';

// Cada nivel de confianza tiene glifo y texto: el color nunca va solo.
export const CONFIDENCE: Record<Confidence, { glyph: string; label: string; hint: string; className: string }> = {
  confirmed: { glyph: '●', label: 'Confirmado', hint: 'Evidencia directa en código o configuración', className: 'text-accent-lime' },
  supported: { glyph: '◐', label: 'Respaldado', hint: 'Evidencia indirecta: documentación o configuración no demostrada', className: 'text-accent-electric' },
  inferred: { glyph: '△', label: 'Inferido', hint: 'Interpretación razonable sin demostración directa', className: 'text-accent-amber' },
  unknown: { glyph: '?', label: 'Desconocido', hint: 'Sin información suficiente', className: 'text-white/60' },
};
export const CONFIDENCE_ORDER: Confidence[] = ['confirmed', 'supported', 'inferred', 'unknown'];

// Estilo de línea por confianza: legible también sin color.
export const EDGE_DASH: Record<Confidence, string | undefined> = {
  confirmed: undefined,
  supported: '6 4',
  inferred: '2 4',
  unknown: '1 6',
};

export const COMPONENT_TYPE: Record<ComponentType, { label: string; color: string }> = {
  client: { label: 'Cliente', color: '#c6ff3d' },
  service: { label: 'Servicio', color: '#3df0ff' },
  module: { label: 'Módulo', color: '#3df0ff' },
  job: { label: 'Job', color: '#3df0ff' },
  database: { label: 'Base de datos', color: '#ffb13d' },
  'vector-store': { label: 'Vector store', color: '#ffb13d' },
  external: { label: 'Externo', color: '#d4d4dc' },
  infrastructure: { label: 'Infraestructura', color: '#ff3dd1' },
};

export const RELATIONSHIP_TYPE: Record<RelationshipType, string> = {
  http: 'HTTP',
  sdk: 'SDK',
  sql: 'SQL / RPC',
  import: 'Import',
  message: 'Mensaje',
  invokes: 'Ejecuta',
  deploy: 'Deploy',
  scrape: 'Lectura',
};

export const EVIDENCE_TYPE: Record<EvidenceType, string> = {
  source: 'código',
  config: 'config',
  dependency: 'dependencia',
  documentation: 'documentación',
  migration: 'migración',
  route: 'ruta',
  import: 'import',
  'api-call': 'llamada',
  environment: 'entorno',
  deployment: 'deploy',
};

export const BASIS = {
  observed: { label: 'Hecho observado', glyph: '●', hint: 'El código demuestra la decisión' },
  documented: { label: 'Decisión documentada', glyph: '◆', hint: 'El repositorio explica el porqué' },
  inferred: { label: 'Inferencia del análisis', glyph: '△', hint: 'Interpretación: el repositorio no lo explica' },
} as const;

// Analítica mínima y sin terceros: emite un evento del DOM y, si la página
// ya tiene un dataLayer, lo empuja ahí. No se recopila nada más.
export type TrackEvent =
  | 'system_map_open'
  | 'node_selected'
  | 'relationship_selected'
  | 'evidence_opened'
  | 'github_opened'
  | 'architecture_mode_changed';

export function track(event: TrackEvent, data: Record<string, string> = {}) {
  if (typeof window === 'undefined') return;
  const detail = { event, ...data };
  window.dispatchEvent(new CustomEvent('system-map:track', { detail }));
  const layer = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
  if (Array.isArray(layer)) layer.push(detail);
}

export function ConfidenceBadge({ level, compact = false }: { level: Confidence; compact?: boolean }) {
  const c = CONFIDENCE[level];
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] ${c.className}`} title={c.hint}>
      <span aria-hidden="true">{c.glyph}</span>
      {compact ? <span className="sr-only">{c.label}</span> : c.label}
    </span>
  );
}

export function EvidenceList({ evidence, context }: { evidence: Evidence[]; context: string }) {
  if (evidence.length === 0) {
    return (
      <p className="text-sm text-white/55 leading-relaxed">
        Sin evidencia directa en el repositorio. Por eso se marca como{' '}
        <span className="text-accent-amber">△ inferido</span>.
      </p>
    );
  }
  return (
    <ul className="grid gap-2.5">
      {evidence.map((ev) => (
        <li key={`${ev.path}#${ev.lines ?? ''}`} className="border border-white/10 bg-black/30 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip !py-0.5 !text-[10px]">{EVIDENCE_TYPE[ev.type]}</span>
            <a
              href={ev.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => track('evidence_opened', { context, path: ev.path })}
              className="min-w-0 break-all font-mono text-xs text-accent-electric underline decoration-accent-electric/30 underline-offset-4 hover:decoration-accent-electric"
            >
              {ev.path}
              {ev.dir ? '/' : ''}
              {ev.lines ? `:${ev.lines}` : ''}
              <span aria-hidden="true"> ↗</span>
              <span className="sr-only"> (abre GitHub en el commit analizado)</span>
            </a>
          </div>
          {ev.excerpt && (
            <code className="mt-2 block overflow-x-auto whitespace-pre border-l-2 border-white/15 bg-black/40 px-2.5 py-1.5 font-mono text-[11px] leading-relaxed text-white/75">
              {ev.excerpt}
            </code>
          )}
          {ev.note && <p className="mt-1.5 text-xs text-white/50">{ev.note}</p>}
        </li>
      ))}
    </ul>
  );
}
