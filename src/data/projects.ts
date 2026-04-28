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
      'Experimento técnico-producto en un nicho visual reducido: una plataforma de fondos de pantalla orientada a cultura tech, cyberpunk y estética digital. El objetivo no era construir otro sitio de fondos, sino validar qué tan difícil es generar tráfico orgánico, estructurar contenido indexable y explorar monetización vía anuncios en un mercado saturado.',
    stack: ['Astro', 'Node', 'Postgres', 'Cloudflare', 'Supabase'],
    problem:
      'Validar si un nicho visual altamente específico podía generar tráfico orgánico y monetización sin depender de una comunidad previa.',
    solution:
      'Construí un sitio experimental de enfoque estático con contenido indexable, distribución optimizada de imágenes, taxonomía por estilos y módulos dinámicos para explorar análisis visual con IA.',
    architecture: [
      'Astro + Cloudflare Pages para entrega en edge',
      'Supabase como servidor de metadatos',
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
    previewImage: '/previews/crackingwall.webp',
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
      'Postgres con triggers para distribución de eventos (Supabase Realtime opcional)',
      'Encriptación E2E por usuario',
    ],
    decisions: [
      {
        title: 'UX invisible es la UX',
        body: 'Una herramienta que necesita interfaz para usarse, fracasó. Clippy gana cuando el usuario la olvida.',
      },
      {
        title: 'Tiempo real > consulta periódica',
        body: 'Consultar cada cierto tiempo rompe la ilusión de continuidad. WebSocket persistente con reconexión exponencial.',
      },
    ],
    learnings: [
      'El mejor producto de productividad es invisible',
      'El tiempo real no es una funcionalidad, es una expectativa',
      'Multiplataforma sin Electron es viable cuando el daemon hace el trabajo pesado',
    ],
    link: 'https://clippy-pages.pages.dev/',
    previewImage: '/previews/clippy.webp',
    accent: 'electric',
    status: 'beta',
  },
  {
    slug: 'indexer',
    title: 'Indexer',
    tagline: 'Motor de conocimiento técnico para convertir recursos dispersos en rutas accionables',
    description:
      'Indexer nace como una respuesta a un problema muy común en equipos técnicos: la información útil queda dispersa entre bookmarks, repositorios, READMEs, hilos, herramientas y recursos compartidos por comunidad. El objetivo no es guardar enlaces, sino transformar esos recursos en una base de conocimiento navegable capaz de responder qué piezas hacen falta para construir un sistema concreto y en qué orden conviene usarlas.',
    stack: ['React', 'Node', 'Postgres', 'D3.js', 'Supabase'],
    problem:
      'La información técnica valiosa está fragmentada en bookmarks, repos y READMEs. El reto real no es encontrar enlaces, sino conectar recursos, capacidades y objetivos.',
    solution:
      'Diseñé un sistema que captura recursos, extrae metadatos, clasifica repos y los organiza como rutas por objetivo: de una necesidad técnica a una secuencia de herramientas compatibles.',
    architecture: [
      'Captura de bookmarks, repos, links y READMEs desde múltiples fuentes',
      'Backend Node para ingesta, deduplicación, parsing y enriquecimiento',
      'Postgres como grafo relacional de recursos, entidades y capacidades',
      'Búsqueda por objetivo: necesidad → pasos → herramientas → alternativas',
    ],
    decisions: [
      {
        title: 'De buscador a motor de rutas',
        body: 'La decisión central fue evitar una lista de resultados. Indexer apunta a responder: estas son las piezas que necesitas, este es el orden recomendado y estas son las alternativas por paso.',
      },
      {
        title: 'README como contexto real',
        body: 'Cuando detecta un repo, el sistema puede extraer su README, limpiarlo, dividirlo por secciones e indexar fragmentos. Eso mejora la precisión frente a depender solo del nombre o las keywords.',
      },
      {
        title: 'Clasificación antes que IA generativa',
        body: 'El primer enfoque prioriza reglas, taxonomías, búsqueda full-text, trigramas, co-ocurrencia y scoring. La meta es construir una base confiable antes de depender de un LLM.',
      },
      {
        title: 'Datos conectados, no datos guardados',
        body: 'La cadena clave es bookmark → repo → README → chunks → herramientas → capacidades → pasos → objetivo → ruta. Esa relación convierte recursos sueltos en conocimiento accionable.',
      },
    ],
    learnings: [
      'El diferencial no está en guardar información, sino en modelar relaciones útiles para tomar decisiones técnicas',
      'Un buen clasificador reduce ruido y permite rankear compatibilidad entre repos, herramientas y objetivos',
      'La UX de discovery debe parecerse más a un pipeline o mapa de ruta que a una página de resultados',
    ],
    link: 'https://filipaovfx.github.io/indexer/',
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
