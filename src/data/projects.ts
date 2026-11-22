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
  /** Marca el proyecto que tiene una historia de pivote animada en su página. */
  pivot?: boolean;
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
      'Motor 3D extraído a su propio paquete y repo (@filipaovfx/svg3d), reutilizable fuera del sitio',
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
      'Un Durable Object por código de sesión (ClippyCoordinator), con hibernación',
      'Express + ws como runtime alternativo para self-host, con el mismo protocolo',
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
        body: 'El contenido copiado nunca se guarda y los metadatos de la sesión se borran al vencer el TTL. Menos superficie de datos es menos superficie de riesgo: no hay historial que filtrar.',
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
    slug: 'botrepos',
    title: 'botRepos',
    tagline: 'Búsqueda semántica sobre mis propios repos, desde Telegram — y el pivote que la hizo existir',
    description:
      'botRepos empezó siendo otra cosa. Se llamaba Indexer y era un motor de rutas: una extensión de navegador capturaba recursos, un backend los clasificaba y una interfaz web respondía «para construir esto necesitas estas piezas, en este orden». El motor funcionó. La interfaz no: nadie abre una página web para resolver una duda de diez segundos. Al revisar qué parte estaba generando valor de verdad, la respuesta no era la ruta sugerida sino el corpus que había debajo — READMEs extraídos, limpiados y clasificados con evidencia trazable. Así que corté la mitad que sobraba y le puse encima lo que faltaba: embeddings, un índice vectorial y la interfaz que ya está abierta en el teléfono de cualquiera. Hoy es un bot de Telegram en producción.',
    stack: ['Node', 'Telegram', 'OpenAI', 'Pinecone', 'Supabase', 'systemd'],
    problem:
      'Tenía un motor de conocimiento que funcionaba y una interfaz que nadie usaba. El problema real no era técnico: era haberme enamorado de la forma del producto en vez del valor que ya estaba produciendo.',
    solution:
      'Conservar el corpus y la ingesta —la parte que sí producía valor— y reemplazar todo lo que venía después: chunking, embeddings, índice vectorial y un bot de Telegram como interfaz. El mismo conocimiento, en el lugar donde la pregunta de verdad ocurre.',
    architecture: [
      'Ingesta: Supabase → chunking → embeddings → Pinecone, en dos fuentes (bookmarks y READMEs de GitHub)',
      'Embeddings OpenAI text-embedding-3-small, 1536 dimensiones',
      'Pinecone como índice vectorial; Supabase sigue siendo la fuente de verdad y la capa de logs',
      'Bot de Telegram y CLI comparten el mismo orquestador de búsqueda',
      'Evaluación versionada: un set de consultas fijo con baseline contra v1 para medir si un cambio mejora o empeora',
      'Operación con systemd: ingesta cada 6 h y un chequeo cada 5 min sobre PM2, Telegram, Supabase, Pinecone y RAM — que alerta en las transiciones, no en cada vuelta',
    ],
    decisions: [
      {
        title: 'Matar la interfaz, no el motor',
        body: 'Lo difícil de un pivote no es cambiar de idea: es distinguir qué parte sirve. El corpus y la ingesta se quedaron intactos; la UI web y el ranking por reglas se fueron. Pivotar no fue empezar de cero, fue cortar por la junta correcta.',
      },
      {
        title: 'El LLM entró cuando la base lo aguantaba',
        body: 'La primera versión evitó deliberadamente la IA generativa: primero reglas, full-text y scoring con evidencia. Esa disciplina es la que permitió montar el RAG encima sin construir sobre arena — los embeddings indexan un corpus que ya estaba limpio.',
      },
      {
        title: 'La interfaz correcta ya estaba abierta',
        body: 'Telegram no es una decisión estética. Es el único lugar donde la pregunta ocurre sin fricción: no hay que abrir nada, no hay que recordar una URL, y las alertas del propio sistema llegan por el mismo canal.',
      },
      {
        title: 'Medir la búsqueda, no opinar sobre ella',
        body: 'Un RAG siempre devuelve algo, y eso lo hace fácil de autoengañar. Hay un set de consultas fijo y un baseline guardado: cada cambio se compara contra él antes de quedarse.',
      },
    ],
    learnings: [
      'El valor de un sistema rara vez está donde uno lo diseñó: está donde la gente vuelve',
      'Pivotar bien es una operación quirúrgica, no un borrón y cuenta nueva — el trabajo está en saber qué se conserva',
      'Una interfaz que exige que el usuario cambie de contexto compite contra no usar el producto, y pierde',
    ],
    link: 'https://t.me/Indexer_rag_bot',
    repo: 'https://github.com/FilipaoVfx/botRepos',
    previewImage: '/previews/indexer.webp',
    previewLabel: 'la interfaz que se jubiló',
    accent: 'magenta',
    status: 'live',
    pivot: true,
  },
];

export const stackTokens = {
  frontend: { color: '#c6ff3d', label: 'Interfaz' },
  backend: { color: '#3df0ff', label: 'Servidor' },
  infra: { color: '#ff3dd1', label: 'Infraestructura' },
  data: { color: '#ffb13d', label: 'Datos' },
} as const;
