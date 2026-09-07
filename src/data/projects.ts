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
  previewLabel?: string;
  accent: 'lime' | 'electric' | 'magenta';
  status: 'live' | 'beta' | 'wip';
};

export const projects: Project[] = [
  {
    slug: 'pixelatmos',
    title: 'Pixelatmos',
    tagline: 'Estudio independiente: herramientas creativas propias en el navegador',
    description:
      'Pixelatmos es un estudio de una sola persona en el cruce entre software y cultura visual. El núcleo son tres herramientas originales que corren enteras en el navegador —3D Lab, ASCII Lab y Visual Protocol— sin instalar nada y sin registro. Alrededor de ellas hay una galería curada de wallpapers de cultura tech que le da al sitio un mundo visual propio y un canal de distribución. Hoy: 3.085 descargas y 313 likes acumulados.',
    stack: ['Astro', 'React', 'Three.js', 'Cloudflare', 'Supabase'],
    problem:
      'Las herramientas creativas útiles viven detrás de instaladores, cuentas y suscripciones. Y un estudio nuevo no tiene audiencia: hay que ganarla con producto real y contenido indexable, no con anuncios.',
    solution:
      'Tres herramientas que resuelven algo concreto y corren en el dispositivo del usuario, más una galería curada que atrae al mismo público. El sitio se renderiza en el edge para ser rápido e indexable desde el primer request.',
    architecture: [
      'Astro 5 con output server sobre Cloudflare Workers',
      'Islas React 19 solo en las herramientas; el resto es HTML servido desde el edge',
      '3D Lab: SVG o texto → objeto 3D interactivo, con export a PNG/GLB',
      'Motor 3D extraído a su propio paquete y repo (3dsvg), reutilizable fuera del sitio',
      'Supabase como Postgres de metadatos + Storage de las piezas',
      'LLM de visión vía OpenRouter para Visual Protocol',
      'AdSense y Clarity detrás del consentimiento',
    ],
    decisions: [
      {
        title: 'Las herramientas son el producto',
        body: 'La galería atrae, las herramientas retienen. Por eso el trabajo duro está en 3D Lab, ASCII Lab y Visual Protocol: software original, no un wrapper sobre el producto de otro.',
      },
      {
        title: 'Procesar en el cliente, no en mi servidor',
        body: 'Las herramientas corren en el dispositivo del usuario. Sin subir archivos, sin cola de trabajos, sin factura de cómputo que escale con el tráfico. La privacidad sale gratis como efecto secundario.',
      },
      {
        title: 'Curaduría antes que volumen',
        body: 'Nueve piezas seleccionadas contra un manifiesto estético escrito, en vez de mil piezas generadas. En un nicho saturado, la coherencia es la ventaja competitiva.',
      },
      {
        title: 'El motor 3D vive aparte',
        body: 'La lógica de SVG a 3D se publicó como paquete propio en su repo. Si el sitio muere, el motor sigue siendo útil: obliga a diseñar una API limpia en vez de código pegado a una página.',
      },
    ],
    learnings: [
      'SEO programático como herramienta de validación de nicho, no solo de crecimiento',
      'La monetización condiciona contenido, rendimiento y arquitectura antes de lo que uno cree',
      'Distribuir es tan difícil como construir: sin audiencia previa, el producto tiene que traer su propio canal',
    ],
    link: 'https://pixelatmos.com/',
    repo: 'https://github.com/FilipaoVfx/pixelatmos',
    previewImage: '/previews/pixelatmos.webp',
    previewLabel: 'obra original del sitio',
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
