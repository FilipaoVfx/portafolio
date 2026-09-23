// Adaptador: hechos estáticos + interpretación versionada → Architecture IR.
//
// La interpretación (interpretation.json) nombra componentes, agrupa
// módulos y explica decisiones. Puede redactarse con ayuda de un LLM, pero
// fuera del build y revisada en git. Lo que NO puede hacer:
//   - citar evidencia que el análisis estático no encuentre (falla la
//     generación y se conserva el artefacto anterior);
//   - declarar una confianza mayor que la que su evidencia sostiene
//     (la confianza se calcula aquí, la interpretación solo puede bajarla);
//   - ocultar relaciones que los hechos demuestran: las relaciones
//     detectadas se publican aunque la interpretación no las mencione.

import { ANALYSIS_VERSION, GENERATOR_VERSION, SCHEMA_VERSION } from './constants.mjs';
import { applyCap, confidenceFromEvidence, evidenceUrl } from './model.mjs';
import { makeExcerpt } from './sanitize.mjs';

const MAX_EVIDENCE_PER_ELEMENT = 8;
const TYPE_PRIORITY = ['http', 'sql', 'sdk', 'invokes', 'deploy', 'scrape', 'message', 'import'];

function linesOf(start, end) {
  return end && end > start ? `${start}-${end}` : `${start}`;
}

function routeMatches(route, callPath) {
  if (!route.path || route.path === '/') return callPath === '/';
  if (route.path === callPath) return true;
  const pattern = new RegExp(`^${route.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:[A-Za-z_]+/g, '[^/]+')}$`);
  if (pattern.test(callPath)) return true;
  // `${API}/api/github-readmes/${owner}/${repo}`: el extractor corta en la
  // interpolación; vale si el prefijo estático coincide por segmentos.
  return route.path.includes(':') && route.path.startsWith(`${callPath}/`);
}

function specificity(routePath) {
  const segments = routePath.split('/').filter(Boolean);
  return segments.filter((seg) => !seg.startsWith(':')).length * 10 - segments.filter((seg) => seg.startsWith(':')).length;
}

export function interpret({ project, interpretation, facts, files, directories, commit, committedAt, languages, excluded, generatedAt }) {
  const errors = [];
  const warnings = [];
  const repository = project.repository;
  const lineCount = (file) => files.get(file)?.split('\n').length ?? 0;

  const makeEvidence = (ev) => {
    const out = { type: ev.type, path: ev.path };
    if (ev.dir) out.dir = true;
    if (ev.lines) out.lines = ev.lines;
    if (ev.excerpt) out.excerpt = ev.excerpt;
    if (ev.note) out.note = ev.note;
    out.url = evidenceUrl(repository, commit, out);
    return out;
  };
  const fromFact = (fact, type, note) =>
    makeEvidence({ type, path: fact.file, lines: linesOf(fact.line, fact.endLine), excerpt: fact.excerpt, note });

  // --- Membresía: cada archivo pertenece al componente con el prefijo más largo.
  const components = interpretation.components;
  const shared = new Set(interpretation.sharedModules ?? []);
  const owners = [];
  for (const c of components) for (const p of c.paths ?? []) owners.push({ id: c.id, prefix: p.replace(/\/$/, '') });
  owners.sort((a, b) => b.prefix.length - a.prefix.length);
  const ownerOf = (file) =>
    owners.find((o) => file === o.prefix || file.startsWith(`${o.prefix}/`))?.id ?? null;

  for (const c of components) {
    for (const p of c.paths ?? []) {
      const clean = p.replace(/\/$/, '');
      if (!files.has(clean) && !directories.has(clean)) errors.push(`component ${c.id}: path "${p}" no existe en ${commit.slice(0, 7)}`);
    }
  }

  // --- Resolución de evidencia declarada (matchers).
  const byKind = new Map();
  for (const f of facts) {
    if (!byKind.has(f.kind)) byKind.set(f.kind, []);
    byKind.get(f.kind).push(f);
  }
  const factsOf = (kind, pred) => (byKind.get(kind) ?? []).filter(pred);

  function resolve(matcher, where) {
    const [op, spec] = Object.entries(matcher).find(([k]) => k !== 'note') ?? [];
    const note = matcher.note;
    const fail = (msg) => {
      errors.push(`${where}: ${msg} (${JSON.stringify(matcher)})`);
      return [];
    };
    const pick = (list, type, label) => {
      if (list.length === 0) return fail(`${label} no encontrado`);
      const shown = list.slice(0, spec.all ? 4 : 1);
      const extra = list.length > shown.length ? ` · ${list.length} ocurrencias` : '';
      return shown.map((f, i) => fromFact(f, type, i === 0 && (note || extra) ? `${note ?? ''}${extra}`.replace(/^ · /, '') : note));
    };
    switch (op) {
      case 'import':
        return pick(factsOf('import', (f) => f.file === spec.file && (f.specifier === spec.specifier || f.package === spec.specifier)), 'import', 'import');
      case 'route':
        return pick(factsOf('route', (f) => f.file === spec.file && f.path === spec.path && (!spec.method || f.method === spec.method)), 'route', 'ruta');
      case 'call':
        return pick(
          spec.host
            ? factsOf('host', (f) => f.file === spec.file && f.host === spec.host)
            : factsOf('call', (f) => f.file === spec.file && f.path === spec.path),
          'api-call',
          'llamada',
        );
      case 'table':
      case 'rpc':
        return pick(factsOf(op, (f) => f.file === spec.file && f.name === spec.name), 'source', op);
      case 'sql':
        return pick(factsOf('sql-object', (f) => f.file === spec.file && f.name === spec.object.toLowerCase()), 'migration', 'objeto SQL');
      case 'dependency':
        return pick(factsOf('dependency', (f) => f.file === spec.manifest && f.name === spec.name), 'dependency', 'dependencia');
      case 'script':
        return pick(factsOf('script', (f) => f.file === spec.manifest && f.name === spec.name), 'dependency', 'script');
      case 'env':
        return pick(factsOf('env', (f) => f.file === spec.file && f.name === spec.name), 'environment', 'variable de entorno');
      case 'doc':
        return pick(factsOf('heading', (f) => f.file === spec.file && f.title.toLowerCase().includes(spec.heading.toLowerCase())), 'documentation', 'sección');
      case 'pattern': {
        const text = files.get(spec.file);
        if (text === undefined) return fail('archivo no encontrado o excluido');
        const re = new RegExp(spec.regex);
        const lines = text.split('\n');
        const idx = lines.findIndex((l) => re.test(l));
        if (idx < 0) return fail('patrón no encontrado');
        const span = Math.max(1, spec.span ?? 1);
        const end = Math.min(lines.length, idx + span);
        return [makeEvidence({ type: spec.type ?? 'source', path: spec.file, lines: linesOf(idx + 1, end), excerpt: makeExcerpt(lines[idx]), note })];
      }
      case 'file': {
        if (!files.has(spec.path)) return fail('archivo no encontrado o excluido');
        return [makeEvidence({ type: spec.type ?? 'source', path: spec.path, note: note ?? `${lineCount(spec.path)} líneas` })];
      }
      case 'dir': {
        if (!directories.has(spec.path)) return fail('directorio no encontrado');
        const count = [...files.keys()].filter((f) => f.startsWith(`${spec.path}/`) && (!spec.ext || f.endsWith(spec.ext))).length;
        return [makeEvidence({ type: spec.type ?? 'source', path: spec.path, dir: true, note: note ?? `${count} archivos${spec.ext ? ` ${spec.ext}` : ''}` })];
      }
      default:
        return fail(`matcher desconocido "${op}"`);
    }
  }

  const resolveAll = (list, where) => (list ?? []).flatMap((m) => resolve(m, where));

  // --- Componentes.
  const outComponents = components.map((c) => {
    const componentFiles = [...files.keys()].filter((f) => ownerOf(f) === c.id);
    const evidence = resolveAll(c.evidence, `component ${c.id}`);
    // Los paths declarados son evidencia de existencia del componente.
    for (const p of (c.paths ?? []).slice(0, 3)) {
      const clean = p.replace(/\/$/, '');
      if (evidence.some((e) => e.path === clean)) continue;
      evidence.push(
        directories.has(clean)
          ? makeEvidence({ type: 'source', path: clean, dir: true, note: `${componentFiles.filter((f) => f.startsWith(`${clean}/`)).length} archivos` })
          : makeEvidence({ type: 'source', path: clean, note: `${lineCount(clean)} líneas` }),
      );
    }
    const routes = facts.filter((f) => f.kind === 'route' && f.method && ownerOf(f.file) === c.id).length;
    const out = {
      id: c.id,
      name: c.name,
      type: c.type,
      group: c.group,
      summary: c.summary,
      role: c.role,
      technologies: c.technologies ?? [],
      paths: c.paths ?? [],
      metrics: {
        files: componentFiles.length,
        lines: componentFiles.reduce((n, f) => n + lineCount(f), 0),
        ...(routes ? { routes } : {}),
      },
      confidence: applyCap(confidenceFromEvidence(evidence), c.cap),
      evidence: evidence.slice(0, MAX_EVIDENCE_PER_ELEMENT),
    };
    if (c.caveat) out.caveat = c.caveat;
    return out;
  });
  const componentById = new Map(outComponents.map((c) => [c.id, c]));
  const declared = new Map(components.map((c) => [c.id, c]));

  // --- Relaciones detectadas por análisis estático.
  const detected = new Map();
  const edge = (source, target, type) => {
    if (!source || !target || source === target) return null;
    const id = `${source}--${target}`;
    if (!detected.has(id)) detected.set(id, { id, source, target, types: new Set(), evidence: [], endpoints: new Set() });
    const e = detected.get(id);
    e.types.add(type);
    return e;
  };

  const packageOwner = new Map();
  const hostOwner = new Map();
  for (const c of components) {
    for (const p of c.packages ?? []) packageOwner.set(p, c.id);
    for (const h of c.hosts ?? []) hostOwner.set(h, c.id);
  }

  for (const f of byKind.get('import') ?? []) {
    const from = ownerOf(f.file);
    if (f.resolved && !shared.has(f.resolved)) {
      edge(from, ownerOf(f.resolved), 'import')?.evidence.push(fromFact(f, 'import'));
    } else if (f.package && packageOwner.has(f.package)) {
      edge(from, packageOwner.get(f.package), 'sdk')?.evidence.push(fromFact(f, 'import'));
    }
  }

  // Rutas por código (node:http, express…) y por archivo (endpoints de Astro/Next).
  const routes = [...(byKind.get('route') ?? []), ...(byKind.get('page') ?? [])].filter((r) => ownerOf(r.file));
  for (const call of byKind.get('call') ?? []) {
    const from = ownerOf(call.file);
    // La ruta más específica gana: `/api/decode` no es `/:category/:slug`.
    const route = routes
      .filter((r) => routeMatches(r, call.path) && ownerOf(r.file) !== from)
      .sort((a, b) => specificity(b.path) - specificity(a.path))[0];
    if (!route) continue;
    const e = edge(from, ownerOf(route.file), 'http');
    if (!e) continue;
    e.endpoints.add(route.method ? `${route.method} ${route.path}` : route.path);
    e.evidence.push(fromFact(call, 'api-call'));
    if (!e.evidence.some((x) => x.path === route.file && x.lines === linesOf(route.line, route.endLine))) {
      e.evidence.push(fromFact(route, 'route'));
    }
  }

  for (const h of byKind.get('host') ?? []) {
    if (!h.call || !hostOwner.has(h.host)) continue;
    edge(ownerOf(h.file), hostOwner.get(h.host), 'http')?.evidence.push(fromFact(h, 'api-call', h.host));
  }

  for (const run of byKind.get('workflow-run') ?? []) {
    for (const target of run.targets) {
      edge(ownerOf(run.file), ownerOf(target), 'invokes')?.evidence.push(fromFact(run, 'deployment'));
    }
  }

  // Acceso a datos: las consultas del componente respaldan su arista hacia la base.
  for (const e of detected.values()) {
    const target = declared.get(e.target);
    if (!['database', 'vector-store'].includes(target?.type)) continue;
    const access = facts.filter((f) => (f.kind === 'table' || f.kind === 'rpc') && ownerOf(f.file) === e.source);
    if (target.type === 'database' && access.length) {
      e.types.add('sql');
      const names = [...new Set(access.map((f) => `${f.kind === 'rpc' ? 'rpc ' : ''}${f.name}`))];
      names.slice(0, 6).forEach((n) => e.endpoints.add(n));
      if (names.length > 6) e.endpoints.add(`+${names.length - 6} más`);
      e.evidence.push(...access.slice(0, 3).map((f) => fromFact(f, 'source')));
    }
  }

  // --- Fusión con las relaciones de la interpretación.
  const outRelationships = [];
  const described = new Set();
  for (const r of interpretation.relationships ?? []) {
    const id = `${r.source}--${r.target}`;
    described.add(id);
    const auto = detected.get(id);
    const evidence = [...resolveAll(r.evidence, `relationship ${id}`), ...(auto?.evidence ?? [])];
    const type = r.type ?? (auto ? TYPE_PRIORITY.find((t) => auto.types.has(t)) : null);
    if (!type) {
      errors.push(`relationship ${id}: sin tipo y sin hechos que lo determinen`);
      continue;
    }
    const out = {
      id,
      source: r.source,
      target: r.target,
      type,
      label: r.label,
      description: r.description,
      detected: Boolean(auto),
      confidence: applyCap(confidenceFromEvidence(evidence), r.cap),
      evidence: dedupe(evidence).slice(0, MAX_EVIDENCE_PER_ELEMENT),
    };
    const endpoints = [...(auto?.endpoints ?? [])];
    if (endpoints.length) out.endpoints = endpoints;
    if (r.caveat) out.caveat = r.caveat;
    outRelationships.push(out);
  }
  for (const auto of detected.values()) {
    if (described.has(auto.id)) continue;
    const type = TYPE_PRIORITY.find((t) => auto.types.has(t));
    const endpoints = [...auto.endpoints];
    const targetName = componentById.get(auto.target)?.name ?? auto.target;
    warnings.push(`relación detectada sin describir: ${auto.id} (${type})`);
    outRelationships.push({
      id: auto.id,
      source: auto.source,
      target: auto.target,
      type,
      label: endpoints.length ? endpoints.slice(0, 2).join(', ') : `${type} → ${targetName}`,
      description: 'Detectada por el análisis estático; sin descripción en la interpretación.',
      detected: true,
      confidence: confidenceFromEvidence(auto.evidence),
      evidence: dedupe(auto.evidence).slice(0, MAX_EVIDENCE_PER_ELEMENT),
      ...(endpoints.length ? { endpoints } : {}),
    });
  }
  for (const r of outRelationships) {
    if (!componentById.has(r.source)) errors.push(`relationship ${r.id}: source "${r.source}" no existe`);
    if (!componentById.has(r.target)) errors.push(`relationship ${r.id}: target "${r.target}" no existe`);
  }
  const relById = new Map(outRelationships.map((r) => [r.id, r]));

  // --- Flujos.
  const outFlows = (interpretation.flows ?? []).map((flow) => ({
    id: flow.id,
    kind: flow.kind,
    name: flow.name,
    summary: flow.summary,
    steps: flow.steps.map((s, i) => {
      const where = `flow ${flow.id} step ${i + 1}`;
      const evidence = resolveAll(s.evidence, where);
      const relationshipId = s.relationship ? s.relationship.replace('->', '--') : undefined;
      if (relationshipId && !relById.has(relationshipId)) errors.push(`${where}: relación "${s.relationship}" no existe`);
      if (s.component && !componentById.has(s.component)) errors.push(`${where}: componente "${s.component}" no existe`);
      // Sin evidencia propia, el paso hereda la confianza de lo que referencia.
      const inherited = relById.get(relationshipId)?.confidence ?? componentById.get(s.component)?.confidence ?? 'inferred';
      const out = {
        id: `${flow.id}-${i + 1}`,
        label: s.label,
        detail: s.detail,
        confidence: applyCap(evidence.length ? confidenceFromEvidence(evidence) : inherited, s.cap),
        evidence,
      };
      if (s.component) out.component = s.component;
      if (relationshipId) out.relationship = relationshipId;
      if (s.artifact) out.artifact = s.artifact;
      return out;
    }),
  }));

  // --- Decisiones y hallazgos.
  const outDecisions = (interpretation.decisions ?? []).map((d) => {
    const evidence = resolveAll(d.evidence, `decision ${d.id}`);
    const out = {
      id: d.id,
      title: d.title,
      why: d.why,
      basis: d.basis,
      components: d.components ?? [],
      confidence: applyCap(confidenceFromEvidence(evidence), d.basis === 'inferred' ? 'inferred' : d.cap),
      evidence,
    };
    if (d.caveat) out.caveat = d.caveat;
    return out;
  });

  const outFindings = (interpretation.findings ?? []).map((f) => {
    const evidence = resolveAll(f.evidence, `finding ${f.id}`);
    for (const p of f.absent ?? []) {
      if (files.has(p) || directories.has(p)) errors.push(`finding ${f.id}: "${p}" existe; el hallazgo ya no aplica`);
    }
    const out = { id: f.id, severity: f.severity, title: f.title, detail: f.detail, evidence };
    if (f.absent) out.absent = f.absent;
    return out;
  });

  // --- Cobertura: qué parte del repo explica el mapa.
  const codeFiles = [...files.keys()].filter((f) => /\.(m?[jt]sx?|astro|html|sql|ya?ml)$/.test(f) && !f.endsWith('.md'));
  const covered = codeFiles.filter((f) => ownerOf(f));
  const hostsCalled = [...new Set((byKind.get('host') ?? []).filter((h) => h.call).map((h) => h.host))].sort();
  const factsByKind = Object.fromEntries([...byKind.entries()].map(([k, v]) => [k, v.length]).sort());

  const ir = {
    schemaVersion: SCHEMA_VERSION,
    generatorVersion: GENERATOR_VERSION,
    analysisVersion: ANALYSIS_VERSION,
    generatedAt,
    project: {
      slug: project.slug,
      name: project.name,
      summary: interpretation.summary,
      description: interpretation.description,
      technologies: interpretation.technologies ?? [],
    },
    source: {
      repository,
      url: `https://github.com/${repository}`,
      branch: project.branch,
      commit,
      committedAt,
    },
    analysis: {
      filesScanned: files.size,
      excluded,
      languages,
      factsByKind,
      coverage: {
        codeFiles: codeFiles.length,
        mappedFiles: covered.length,
        unmappedFiles: codeFiles.filter((f) => !ownerOf(f)).sort(),
      },
      externalHosts: hostsCalled.map((host) => ({ host, component: hostOwner.get(host) ?? null })),
      sharedModules: [...shared],
    },
    groups: interpretation.groups,
    components: outComponents,
    relationships: outRelationships,
    flows: outFlows,
    decisions: outDecisions,
    findings: outFindings,
  };
  return { ir, errors, warnings };
}

function dedupe(evidence) {
  const seen = new Set();
  return evidence.filter((e) => {
    const key = `${e.path}#${e.lines ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

