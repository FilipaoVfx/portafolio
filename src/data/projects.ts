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
    slug: 'pastty',
    title: 'Pastty',
    tagline: 'Portapapeles compartido entre dispositivos — tiempo real, sin instalar nada',
    description:
      'Pastty es un portapapeles que vive en la nube y sincroniza entre dispositivos en tiempo real. Se emparejan con un código efímero, se abre en el navegador y el contenido viaja por un canal persistente: sin cuentas, sin instalar clientes.',
    stack: ['Node', 'WebSockets', 'Cloudflare', 'Durable Objects', 'PWA'],
    problem:
      'Cambiar de dispositivo rompe el flujo. AirDrop, mail-to-self y apps de notas son fricción disfrazada de solución.',
    solution:
      'Sesiones efímeras identificadas por un código de emparejamiento y un canal WebSocket persistente. Copias en un dispositivo, aparece en el otro, y la sesión se destruye sola.',
    architecture: [
      'Un Durable Object por código de sesión, con hibernación',
      'Express + ws como runtime alternativo para self-host, con el mismo protocolo',
      'Sesiones efímeras por código, con TTL configurable y limpieza periódica',
      'Hasta 5 dispositivos por sesión, con resume token para reconexión',
      'Rate limiting por IP con ventana deslizante y límites de tamaño (10 KB texto / 5 MB imagen)',
      'Frontend PWA con service worker: un único Worker de Cloudflare sirve los assets y hospeda el Durable Object',
    ],
    decisions: [
      {
        title: 'UX invisible es la UX',
        body: 'Una herramienta que necesita interfaz para usarse, fracasó. Pastty gana cuando el usuario la olvida.',
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
    link: 'https://pastty.com/',
    repo: 'https://github.com/FilipaoVfx/clippy',
    previewImage: '/previews/pastty.webp',
    accent: 'electric',
    status: 'beta',
  },
  {
    slug: 'indexer',
    title: 'Indexer',
    tagline: 'Motor de conocimiento técnico: de recursos dispersos a respuestas que sirven',
    description:
      'La información que de verdad sirve queda desperdigada: un bookmark aquí, un README allá, un hilo que nadie vuelve a encontrar. Indexer nació para convertir ese desorden en una base consultable — capturar cada recurso, extraer su README, clasificarlo y poder preguntarle qué piezas hacen falta para construir algo y en qué orden. El motor de conocimiento funcionó. Lo que vino después fue aprender que la forma en que se lo preguntaba no servía, y tener el estómago de cambiarla.',
    stack: ['Node', 'Postgres', 'Chrome MV3', 'OpenAI', 'Pinecone', 'Telegram'],
    problem:
      'Guardar enlaces es fácil y no sirve de nada. El problema real es conectar recursos con objetivos: qué necesito para construir esto, en qué orden y con qué alternativas.',
    solution:
      'Captura desde el navegador, extracción y limpieza de READMEs, clasificación con evidencia trazable y una base que se puede consultar en lenguaje natural. Hoy se consulta desde Telegram, donde la pregunta de verdad ocurre.',
    architecture: [
      'Captura desde el navegador con cola persistente y reintentos',
      'Extracción y limpieza de READMEs, indexados por secciones',
      'Postgres con búsqueda de texto completo, trigramas y clasificación con evidencia',
      'Embeddings y búsqueda semántica sobre ese corpus ya limpio',
      'Consulta desde Telegram, con ingesta y chequeo de salud automáticos',
    ],
    decisions: [
      {
        title: 'Primero la base, después el modelo',
        body: 'La primera versión evitó deliberadamente la IA generativa: reglas, texto completo y clasificación con evidencia que se puede señalar. Esa disciplina es la razón de que después se pudiera montar búsqueda semántica encima sin construir sobre arena.',
      },
      {
        title: 'El README es el contexto',
        body: 'Un repositorio no se entiende por su nombre. El sistema extrae su README, lo limpia y lo indexa por secciones: ahí está lo que la herramienta hace de verdad.',
      },
      {
        title: 'La pregunta donde ocurre',
        body: 'La consulta terminó viviendo en Telegram. No por moda: porque una duda de diez segundos no sobrevive a abrir una página web, y una respuesta que llega al chat se lee.',
      },
      {
        title: 'Degradar con gracia',
        body: 'Si una migración no se aplicó, el sistema avisa y sigue respondiendo en vez de caerse. Lo mismo con las fuentes externas: lo que falla se reintenta solo.',
      },
    ],
    learnings: [
      'El diferencial no está en guardar información, sino en modelar relaciones útiles para decidir',
      'Una base confiable es lo que permite añadir un modelo encima sin que todo se vuelva humo',
      'La mejor interfaz es la que el usuario ya tiene abierta',
    ],
    link: 'https://filipaovfx.github.io/indexer/',
    repo: 'https://github.com/FilipaoVfx/indexer',
    previewImage: '/previews/indexer.webp',
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
