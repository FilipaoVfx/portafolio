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
  accent: 'lime' | 'electric' | 'magenta';
  status: 'live' | 'beta' | 'wip';
};

export const projects: Project[] = [
  {
    slug: 'crackingwall',
    title: 'CrackingWall',
    tagline: 'Laboratorio de SEO, tráfico y monetización en un nicho visual',
    description:
      'Experimento técnico-producto en un nicho visual reducido: una plataforma de fondos de pantalla orientada a cultura tech, cyberpunk y estética digital. El objetivo no era construir otro sitio de fondos, sino validar qué tan difícil es generar tráfico orgánico, estructurar contenido indexable y explorar monetización vía anuncios en un mercado saturado.',
    stack: ['Astro', 'Node', 'Postgres', 'Cloudflare', 'Supabase'],
    problem:
      'Validar si un nicho visual altamente específico podía generar tráfico orgánico y monetización sin depender de una comunidad previa.',
    solution:
      'Construí un sitio experimental de enfoque estático con contenido indexable, distribución optimizada de imágenes, taxonomía por estilos y módulos dinámicos para explorar análisis visual con IA.',
    architecture: [
      'Astro + Cloudflare Pages para entrega en edge',
      'Supabase como backend de metadatos',
      'SEO programático con sitemap dinámico',
      'Proceso de imágenes optimizado para rendimiento',
      'Funciones Edge/API para funcionalidades experimentales con IA',
    ],
    decisions: [
      {
        title: 'Enfoque real',
        body: 'No fue un proyecto de fondos de pantalla como fin, sino un laboratorio para aprender sobre SEO, monetización, distribución, rendimiento y validación de nichos.',
      },
      {
        title: 'Imágenes como datos',
        body: 'Agregué una funcionalidad de análisis visual con IA para convertir imágenes en descripciones estructuradas útiles para búsqueda, clasificación y generación de instrucciones.',
      },
    ],
    learnings: [
      'SEO programático como herramienta de validación, no solo de crecimiento',
      'La monetización condiciona decisiones de contenido, rendimiento y distribución',
      'En nichos visuales, la arquitectura de metadatos pesa tanto como la interfaz',
    ],
    link: 'https://crakingculturewallpaperr.xyz/',
    accent: 'lime',
    status: 'live',
  },
  {
    slug: 'clippy',
    title: 'Clippy',
    tagline: 'Portapapeles en la nube — multidispositivo, tiempo real, invisible',
    description:
      'Un portapapeles que vive en la nube y sincroniza entre dispositivos en tiempo real, sin fricción ni interfaz visible.',
    stack: ['React', 'Node', 'Postgres', 'WebSockets', 'Supabase'],
    problem:
      'Cambiar de dispositivo rompe el flujo. AirDrop, mail-to-self, y apps de notas son fricción disfrazada de solución.',
    solution:
      'Daemon nativo en cada dispositivo + canal persistente en tiempo real. El portapapeles se vuelve transparente: copias en uno, pegas en otro.',
    architecture: [
      'Agente en segundo plano (Win/Mac/Linux)',
      'Node + WebSockets como bus de eventos en tiempo real',
      'Postgres con triggers para fan-out (Supabase Realtime opcional)',
      'Encriptación E2E por usuario',
    ],
    decisions: [
      {
        title: 'UX invisible es la UX',
        body: 'Una herramienta que necesita interfaz para usarse, fracasó. Clippy gana cuando el usuario la olvida.',
      },
      {
        title: 'Realtime > pull',
        body: 'Polling rompe la ilusión de continuidad. WebSocket persistente con reconexión exponencial.',
      },
    ],
    learnings: [
      'El mejor producto de productividad es invisible',
      'El tiempo real no es una funcionalidad, es una expectativa',
      'Cross-platform sin Electron es viable cuando el daemon hace el trabajo pesado',
    ],
    link: 'https://clippy-pages.pages.dev/',
    accent: 'electric',
    status: 'beta',
  },
  {
    slug: 'indexer',
    title: 'Indexer',
    tagline: 'Descubrimiento de comunidades — clasificación visual tipo grafo',
    description:
      'Buscador y mapa visual de comunidades / repos: en lugar de listas, un grafo navegable inspirado en visualizaciones de burbujas cripto.',
    stack: ['React', 'Node', 'Postgres', 'D3.js', 'Supabase'],
    problem:
      'Las listas de "mejores repos / comunidades" son estáticas, sesgadas y no comunican relaciones. Descubrir es navegar, no solo leer.',
    solution:
      'Embeddings + renderizado de grafo: cada nodo es una comunidad, su tamaño es actividad, su posición es similitud semántica.',
    architecture: [
      'Pipeline de ingestión Node (GitHub API + scrapers)',
      'Embeddings → Postgres + pgvector',
      'Renderer D3 con force-directed layout',
      'Filtros semánticos en cliente',
    ],
    decisions: [
      {
        title: 'Visual antes que textual',
        body: 'Mostrar 200 comunidades como grafo comunica más que un top-10 con descripciones.',
      },
      {
        title: 'pgvector sobre vector DB dedicada',
        body: 'Postgres + pgvector cubre el 95% del caso. Agregar Pinecone/Weaviate sería complejidad sin payoff inicial.',
      },
    ],
    learnings: [
      'El descubrimiento es un problema de interfaz, no solo de datos',
      'pgvector elimina la necesidad de una base vectorial dedicada al inicio',
      'Los layouts de fuerza dirigida requieren ajuste fino para no marear al usuario',
    ],
    link: 'https://filipaovfx.github.io/indexer/',
    accent: 'magenta',
    status: 'wip',
  },
];

export const stackTokens = {
  frontend: { color: '#c6ff3d', label: 'Frontend' },
  backend: { color: '#3df0ff', label: 'Backend' },
  infra: { color: '#ff3dd1', label: 'Infra' },
  data: { color: '#ffb13d', label: 'Data' },
} as const;
