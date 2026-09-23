// Contrato compartido entre el generador (Node, build/CI) y el portfolio
// (Astro). Todo lo que el IR puede decir está enumerado aquí: si un valor no
// aparece en estas listas, el validador lo rechaza.

export const SCHEMA_VERSION = '0.1';
export const GENERATOR_VERSION = 'system-map/0.1.0';
// Sube cuando cambian los extractores estáticos: dos artefactos con distinta
// analysisVersion no son comparables línea a línea.
export const ANALYSIS_VERSION = 'static-facts/1';

export const COMPONENT_TYPES = [
  'client', // extensión, SPA, consola: lo que usa una persona
  'service', // proceso que atiende peticiones
  'module', // pieza interna de un servicio
  'job', // proceso batch o programado
  'database',
  'vector-store',
  'external', // API o plataforma de terceros
  'infrastructure', // hosting, CI, observabilidad
];

export const RELATIONSHIP_TYPES = [
  'http', // petición HTTP entre procesos
  'sdk', // cliente oficial de un tercero (supabase-js, pinecone, openai)
  'sql', // consulta/RPC a base de datos
  'import', // dependencia de módulo dentro del mismo proceso
  'message', // mensajería entre contextos (chrome.runtime, colas)
  'invokes', // un job o workflow ejecuta un script
  'deploy', // artefacto publicado en una plataforma
  'scrape', // lectura de datos de una fuente externa (DOM, métricas)
];

export const EVIDENCE_TYPES = [
  'source',
  'config',
  'dependency',
  'documentation',
  'migration',
  'route',
  'import',
  'api-call',
  'environment',
  'deployment',
];

// Evidencia "directa": el código o la configuración ejecutable lo demuestran.
// La documentación solo respalda: puede estar desactualizada.
export const DIRECT_EVIDENCE_TYPES = new Set(EVIDENCE_TYPES.filter((t) => t !== 'documentation'));

export const CONFIDENCE_LEVELS = ['confirmed', 'supported', 'inferred', 'unknown'];
export const CONFIDENCE_RANK = { confirmed: 3, supported: 2, inferred: 1, unknown: 0 };

export const DECISION_BASIS = ['observed', 'documented', 'inferred'];
export const FLOW_KINDS = ['runtime', 'data'];

export const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
export const COMMIT_PATTERN = /^[0-9a-f]{40}$/;
export const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
export const LINES_PATTERN = /^(\d+)(?:-(\d+))?$/;

export const MAX_ARTIFACT_BYTES = 500 * 1024;
export const MAX_EXCERPT_CHARS = 160;
