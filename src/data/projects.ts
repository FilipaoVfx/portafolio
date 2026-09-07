export type Project = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  stack: string[];
  problem: string;
  solution: string;
  architecture: string[];
  decisions: { title: string; body: string }[];
  learnings: string[];
  link?: string;
  repo?: string;
  previewImage?: string;
  accent: 'lime' | 'electric' | 'magenta';
  status: 'live' | 'beta' | 'wip';
};

export const projects: Project[] = [
  {
    slug: 'crackingwall',
    title: 'CrackingWall',
    tagline: 'Laboratorio de SEO, tráfico y monetización en un nicho visual',
    description:
      'Experimento técnico-producto en un nicho visual reducido: un sitio de herramientas creativas y fondos de pantalla orientado a cultura tech y estética digital. El objetivo no era construir otra galería, sino validar qué tan difícil es generar tráfico orgánico, estructurar contenido indexable y explorar monetización vía anuncios en un mercado saturado.',
    stack: ['Astro', 'React', 'Cloudflare', 'Supabase', 'Tailwind'],
    problem:
      'Validar si un nicho visual altamente específico podía generar tráfico orgánico y monetización sin depender de una comunidad previa.',
    solution:
      'Construí un sitio con render en servidor sobre el edge, contenido indexable, taxonomía por estilos y un conjunto de herramientas creativas propias que funcionan en el navegador.',
    architecture: [
      'Astro 5 con output server desplegado en Cloudflare Workers',
      'Supabase como Postgres de metadatos + Storage de imágenes',
      'Islas React 19 solo en las herramientas interactivas',
      'LLM de visión vía OpenRouter para análisis de imágenes',
      'AdSense y Clarity cargados detrás del consentimiento',
    ],
    decisions: [
      {
        title: 'Enfoque real',
        body: 'No fue un proyecto de fondos de pantalla como fin, sino un laboratorio para aprender sobre SEO, monetización, distribución, rendimiento y validación de nichos.',
      },
      {
        title: 'Imágenes como datos',
        body: 'Agregué análisis visual con IA para convertir imágenes en descripciones estructuradas útiles para búsqueda, clasificación y generación de instrucciones.',
      },
      {
        title: 'Islas, no SPA',
        body: 'El contenido se sirve desde el edge y solo las herramientas hidratan React. La galería no paga el costo de un framework que no necesita.',
      },
    ],
    learnings: [
      'SEO programático como herramienta de validación, no solo de crecimiento',
      'La monetización condiciona decisiones de contenido, rendimiento y distribución',
      'En nichos visuales, la arquitectura de metadatos pesa tanto como la interfaz',
    ],
    link: 'https://pixelatmos.com/',
    repo: 'https://github.com/FilipaoVfx/crackingWall',
    previewImage: '/previews/crackingwall.webp',
    accent: 'lime',
    status: 'live',
  },
  {
    slug: 'clippy',
    title: 'Clippy',
    tagline: 'Portapapeles compartido entre dispositivos — tiempo real, sin instalar nada',
    description:
      'Un portapapeles que vive en la nube y sincroniza entre dispositivos en tiempo real. Se emparejan con un código efímero, se abre en el navegador y el contenido viaja por un canal persistente: sin cuentas, sin instalar clientes.',
    stack: ['Node', 'WebSockets', 'Cloudflare', 'Durable Objects', 'PWA'],
    problem:
      'Cambiar de dispositivo rompe el flujo. AirDrop, mail-to-self y apps de notas son fricción disfrazada de solución.',
    solution:
      'Sesiones efímeras identificadas por un código de emparejamiento y un canal WebSocket persistente. Copias en un dispositivo, aparece en el otro, y la sesión se destruye sola.',
    architecture: [
      'Express + ws como servidor de sesiones, con endpoint /health',
      'Durable Object ClippyCoordinator para coordinar sesiones en el edge',
      'Sesiones efímeras por código, con TTL configurable y limpieza periódica',
      'Hasta 5 dispositivos por sesión, con resume token para reconexión',
      'Rate limiting por IP con ventana deslizante y límites de tamaño (10 KB texto / 5 MB imagen)',
      'Frontend PWA con service worker, desplegado en Cloudflare Pages',
    ],
    decisions: [
      {
        title: 'UX invisible es la UX',
        body: 'Una herramienta que necesita interfaz para usarse, fracasó. Clippy gana cuando el usuario la olvida.',
      },
      {
        title: 'Tiempo real > consulta periódica',
        body: 'Consultar cada cierto tiempo rompe la ilusión de continuidad. Canal WebSocket persistente con reconexión.',
      },
      {
        title: 'Efímero por defecto',
        body: 'Nada sobrevive al TTL de la sesión. Menos superficie de datos es menos superficie de riesgo: no hay base de datos que filtrar.',
      },
    ],
    learnings: [
      'El mejor producto de productividad es invisible',
      'El tiempo real no es una funcionalidad, es una expectativa',
      'Un código de emparejamiento + PWA evita instalar software en cada dispositivo',
    ],
    link: 'https://clippy-pages.pages.dev/',
    repo: 'https://github.com/FilipaoVfx/clippy',
    previewImage: '/previews/clippy.webp',
    accent: 'electric',
    status: 'beta',
  },
  {
    slug: 'indexer',
    title: 'Indexer',
    tagline: 'Motor de conocimiento técnico para convertir recursos dispersos en rutas accionables',
    description:
      'Indexer nace como respuesta a un problema común en equipos técnicos: la información útil queda dispersa entre bookmarks, repositorios, READMEs, hilos y herramientas compartidas por la comunidad. El objetivo no es guardar enlaces, sino transformar esos recursos en una base de conocimiento navegable capaz de responder qué piezas hacen falta para construir un sistema concreto y en qué orden usarlas.',
    stack: ['Node', 'Astro', 'React', 'Postgres', 'Chrome MV3', 'Docker'],
    problem:
      'La información técnica valiosa está fragmentada en bookmarks, repos y READMEs. El reto real no es encontrar enlaces, sino conectar recursos, capacidades y objetivos.',
    solution:
      'Un sistema que captura recursos desde el navegador, extrae y enriquece metadatos, clasifica repos y los organiza como rutas por objetivo: de una necesidad técnica a una secuencia de herramientas compatibles.',
    architecture: [
      'Extensión Chrome MV3 con cola persistente y reintentos exponenciales',
      'Backend Node 20 sin framework para ingesta, deduplicación y enriquecimiento',
      'Postgres con FTS tsvector, pg_trgm y funciones RPC · 13 migraciones versionadas',
      'Búsqueda híbrida con ranking + Goal Mode: objetivo → pasos → herramientas → alternativas',
      'Docker multi-stage, CI/CD y backend desplegado en Render',
    ],
    decisions: [
      {
        title: 'De buscador a motor de rutas',
        body: 'La decisión central fue evitar una lista de resultados. Indexer responde: estas son las piezas que necesitas, este es el orden recomendado y estas son las alternativas por paso.',
      },
      {
        title: 'README como contexto real',
        body: 'Cuando detecta un repo, el sistema extrae su README vía API con caché TTL, lo limpia y lo indexa por secciones. Eso mejora la precisión frente a depender solo del nombre o las keywords.',
      },
      {
        title: 'Clasificación antes que IA generativa',
        body: 'El primer enfoque prioriza reglas, taxonomías, búsqueda full-text, trigramas y scoring con evidencia trazable. La meta es una base confiable antes de depender de un LLM.',
      },
      {
        title: 'Degradar con gracia',
        body: 'El backend tolera esquemas desfasados: si una migración aún no se aplicó, avisa y sigue respondiendo en vez de caerse.',
      },
    ],
    learnings: [
      'El diferencial no está en guardar información, sino en modelar relaciones útiles para tomar decisiones técnicas',
      'Un buen clasificador reduce ruido y permite rankear compatibilidad entre repos, herramientas y objetivos',
      'La UX de discovery debe parecerse más a un pipeline o mapa de ruta que a una página de resultados',
    ],
    link: 'https://filipaovfx.github.io/indexer/',
    repo: 'https://github.com/FilipaoVfx/indexer',
    previewImage: '/previews/indexer.webp',
    accent: 'magenta',
    status: 'wip',
  },
];

export const stackTokens = {
  frontend: { color: '#c6ff3d', label: 'Interfaz' },
  backend: { color: '#3df0ff', label: 'Servidor' },
  infra: { color: '#ff3dd1', label: 'Infraestructura' },
  data: { color: '#ffb13d', label: 'Datos' },
} as const;
