// Espejo en TypeScript del Architecture IR (system-map/lib/constants.mjs).
// El renderer solo depende de este contrato, no del generador.

export type Confidence = 'confirmed' | 'supported' | 'inferred' | 'unknown';

export type ComponentType =
  | 'client'
  | 'service'
  | 'module'
  | 'job'
  | 'database'
  | 'vector-store'
  | 'external'
  | 'infrastructure';

export type RelationshipType = 'http' | 'sdk' | 'sql' | 'import' | 'message' | 'invokes' | 'deploy' | 'scrape';

export type EvidenceType =
  | 'source'
  | 'config'
  | 'dependency'
  | 'documentation'
  | 'migration'
  | 'route'
  | 'import'
  | 'api-call'
  | 'environment'
  | 'deployment';

export type Evidence = {
  type: EvidenceType;
  path: string;
  dir?: boolean;
  lines?: string;
  excerpt?: string;
  note?: string;
  url: string;
};

export type ArchComponent = {
  id: string;
  name: string;
  type: ComponentType;
  group: string;
  summary: string;
  role?: string;
  technologies: string[];
  paths: string[];
  metrics: { files: number; lines: number; routes?: number };
  confidence: Confidence;
  caveat?: string;
  evidence: Evidence[];
};

export type ArchRelationship = {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
  label: string;
  description?: string;
  detected: boolean;
  endpoints?: string[];
  confidence: Confidence;
  caveat?: string;
  evidence: Evidence[];
};

export type FlowStep = {
  id: string;
  label: string;
  detail?: string;
  artifact?: string;
  component?: string;
  relationship?: string;
  confidence: Confidence;
  evidence: Evidence[];
};

export type Flow = {
  id: string;
  kind: 'runtime' | 'data';
  name: string;
  summary?: string;
  steps: FlowStep[];
};

export type Decision = {
  id: string;
  title: string;
  why: string;
  basis: 'observed' | 'documented' | 'inferred';
  components: string[];
  confidence: Confidence;
  caveat?: string;
  evidence: Evidence[];
};

export type Finding = {
  id: string;
  severity: 'info' | 'warning';
  title: string;
  detail?: string;
  absent?: string[];
  evidence: Evidence[];
};

export type Architecture = {
  schemaVersion: string;
  generatorVersion: string;
  analysisVersion: string;
  generatedAt: string;
  project: { slug: string; name: string; summary: string; description?: string; technologies: string[] };
  source: { repository: string; url: string; branch: string; commit: string; committedAt: string };
  analysis: {
    filesScanned: number;
    excluded: Record<string, number>;
    languages: Record<string, { files: number; lines: number }>;
    factsByKind: Record<string, number>;
    coverage: { codeFiles: number; mappedFiles: number; unmappedFiles: string[] };
    externalHosts: { host: string; component: string | null }[];
    sharedModules: string[];
  };
  groups: { id: string; name: string }[];
  components: ArchComponent[];
  relationships: ArchRelationship[];
  flows: Flow[];
  decisions: Decision[];
  findings: Finding[];
};
