const baseUrl = import.meta.env.BASE_URL.replace(/\/?$/, '/');
const assetPath = (path: string) => `${baseUrl}${path.replace(/^\/+/, '')}`;

const achievements = [
  {
    title: 'Equipo ganador',
    eyebrow: 'Hackathon Talento Tech',
    src: '/ganadorv1.jpeg',
    alt: 'Equipo ganador del hackathon Talento Tech en inteligencia artificial',
    className: 'lg:col-span-7 rotate-[-0.7deg]',
    imageClassName: 'max-h-[360px]',
  },
  {
    title: 'Premio recibido',
    eyebrow: 'Ganador',
    src: '/ganadorv3.jpeg',
    alt: 'Juan Felipe Gonzalez sosteniendo el premio del hackathon',
    className: 'lg:col-span-5 rotate-[1deg]',
    imageClassName: 'achievement-photo--repair max-h-[360px]',
  },
  {
    title: 'Certificado oficial',
    eyebrow: 'Ministerio TIC',
    src: '/certificado.jpeg',
    alt: 'Certificado de primer lugar en el reto de inteligencia artificial',
    className: 'lg:col-span-7 rotate-[-0.35deg]',
    imageClassName: 'max-h-[320px]',
  },
];

const impactPoints = [
  'ETL con fuentes de comportamiento, transacciones y leads',
  'Scoring de leads, churn y valor potencial',
  'Supabase como capa operativa de datos',
];

const stack = ['ETL Pipeline', 'XGBoost', 'Random Forest', 'Data Augmentation', 'Supabase'];

const sentimentCards = [
  {
    title: 'Extraccion',
    front: 'YouTube API',
    back: 'Captura comentarios masivos y los convierte en una base limpia para analisis.',
  },
  {
    title: 'Lenguaje',
    front: 'NLP',
    back: 'Procesa lenguaje coloquial, ruido social y polaridad para detectar percepcion real.',
  },
  {
    title: 'Decision',
    front: 'Audience insights',
    back: 'Expone patrones de crisis, engagement y reputacion para actuar con criterio.',
  },
];

export default function TimelineGraph() {
  return (
    <section id="logros" className="relative py-24 md:py-28 scroll-mt-24 overflow-hidden">
      <div className="absolute inset-x-0 top-10 h-px bg-gradient-to-r from-transparent via-accent-electric/45 to-transparent" />
      <div className="mx-auto max-w-6xl px-6 sm:px-8 md:px-12 lg:px-14">
        <div className="mb-10 grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <div className="label-mono">/ logros</div>
            <h2 className="heading-display text-3xl md:text-5xl mt-3">
              Trayectoria y reconocimiento
            </h2>
          </div>
          <p className="lg:col-span-4 text-white/62 leading-relaxed">
            Un logro competitivo convertido en evidencia tecnica: diseno de
            datos, modelado predictivo y decisiones de producto bajo presion.
          </p>
        </div>

        <div className="relative achievement-editorial border-y border-white/10 py-6 md:py-8">
          <div className="absolute left-4 top-0 -translate-y-1/2 bg-accent-lime px-3 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-ink-950 shadow-[3px_3px_0_0_#000]">
            hackathon / IA
          </div>
          <div className="grid auto-rows-auto gap-5 lg:grid-cols-12 lg:items-stretch">
            <article className="achievement-bento lg:col-span-5 lg:row-span-2">
              <div className="label-mono text-accent-lime/80">/ solucion ganadora</div>
              <h3 className="heading-display mt-3 text-2xl md:text-4xl leading-tight">
                Ecosistema Predictivo ETL: de datos brutos a inteligencia comercial.
              </h3>
              <p className="mt-5 text-white/72 leading-relaxed">
                Desarrollamos un pipeline integral de ciencia de datos que unifica
                comportamiento, transacciones y leads en Supabase para construir
                una vision 360 del ciclo de vida del cliente.
              </p>
              <p className="mt-4 text-white/62 leading-relaxed">
                La solucion combina scoring de leads, prediccion de churn y
                estimacion de valor potencial para convertir datos comerciales
                complejos en priorizacion accionable.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="border border-white/10 bg-white/[0.04] p-4">
                  <div className="heading-display text-4xl text-accent-lime">92%</div>
                  <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                    precision leads
                  </div>
                </div>
                <div className="border border-white/10 bg-white/[0.04] p-4">
                  <div className="heading-display text-4xl text-accent-electric">3</div>
                  <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                    modelos IA
                  </div>
                </div>
              </div>
            </article>

            <article className="achievement-bento lg:col-span-7">
              <div className="grid gap-4 md:grid-cols-3">
                {impactPoints.map((point, index) => (
                  <div className="border-l-2 border-accent-lime/70 bg-black/20 p-4">
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-electric">
                      0{index + 1}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-white/72">{point}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {stack.map((item) => (
                  <span className="chip" key={item}>{item}</span>
                ))}
              </div>
            </article>

            {achievements.map((item) => (
              <figure
                key={item.src}
                className={`achievement-paper group relative overflow-hidden border-2 border-white/75 bg-ink-950 p-2.5 shadow-[8px_8px_0_0_rgba(255,255,255,0.72)] transition duration-300 hover:rotate-0 hover:-translate-y-1 ${item.className}`}
              >
                <div className="relative overflow-hidden border-2 border-black bg-ink-950">
                  <img
                    src={assetPath(item.src)}
                    alt={item.alt}
                    loading="lazy"
                    className={`h-full min-h-[220px] w-full object-cover opacity-95 contrast-105 saturate-95 transition duration-500 group-hover:scale-[1.015] group-hover:opacity-100 ${item.imageClassName ?? ''}`}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(8,9,14,0.36))]" />
                </div>
                <figcaption className="flex flex-col gap-1 border-t-2 border-white/75 bg-ink-950 px-3 py-3 text-white sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-electric/80">
                    {item.eyebrow}
                  </span>
                  <span className="heading-display text-lg leading-none text-white/90">
                    {item.title}
                  </span>
                </figcaption>
              </figure>
            ))}
            <div className="lg:col-span-12 flex flex-col gap-4 border-l-2 border-accent-lime/70 bg-black/20 px-5 py-4 text-white/72 md:flex-row md:items-center md:justify-between">
              <p className="max-w-3xl leading-relaxed">
                La competencia fue realizada el 21 de noviembre de 2025 en Armenia,
                Quindio.
              </p>
              <div className="font-mono text-xs uppercase tracking-[0.22em] text-accent-electric">
                1er puesto
              </div>
            </div>
            <article className="achievement-bento lg:col-span-12">
              <div className="grid gap-5 lg:grid-cols-12 lg:items-stretch">
                <div className="relative overflow-hidden border-2 border-white/75 bg-ink-950 p-2.5 shadow-[8px_8px_0_0_rgba(255,255,255,0.72)] lg:col-span-5 min-h-[260px]">
                  <img
                    src={assetPath('/presentacionv2.png')}
                    alt="Presentacion del analizador de sentimiento para YouTube"
                    loading="lazy"
                    className="h-full min-h-[240px] w-full object-cover opacity-95 contrast-105 saturate-95"
                  />
                  <div className="pointer-events-none absolute inset-2.5 bg-[linear-gradient(180deg,transparent_55%,rgba(8,9,14,0.62))]" />
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-3 border-t-2 border-white/75 bg-ink-950 px-3 py-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent-electric">
                      demo publica
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/55">
                      NLP
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="chip">comunicacion tecnica</span>
                    <span className="chip">python data science</span>
                    <span className="chip">youtube api</span>
                  </div>
                  <h3 className="heading-display mt-4 text-2xl md:text-4xl leading-tight">
                    Sentiment Intelligence: convirtiendo feedback masivo en lectura de audiencia.
                  </h3>
                  <p className="mt-4 max-w-2xl text-white/70 leading-relaxed">
                    Construí un analizador que transforma comentarios de YouTube
                    en señales accionables de percepción pública, útil para medir
                    reputación, reacción a contenido y riesgos tempranos.
                  </p>

                  <div className="mt-6 grid gap-3 md:grid-cols-3">
                    {sentimentCards.map((card) => (
                      <div
                        className="flip-card min-h-[150px]"
                        tabIndex={0}
                        key={card.title}
                        aria-label={`${card.title}: ${card.front}. ${card.back}`}
                      >
                        <div className="flip-card-inner">
                          <div className="flip-card-face flip-card-front">
                            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-lime/80">
                              {card.title}
                            </div>
                            <div className="heading-display mt-3 text-xl text-white">
                              {card.front}
                            </div>
                          </div>
                          <div className="flip-card-face flip-card-back">
                            <p className="text-sm leading-relaxed text-white/76">
                              {card.back}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <a
                    href="https://github.com/FilipaoVfx/AnalisissentimientoYT"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex border-2 border-black bg-accent-lime px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-ink-950 shadow-[4px_4px_0_0_#000] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000]"
                  >
                    Ver repositorio →
                  </a>
                </div>
              </div>
            </article>
          </div>
        </div>


      </div>
    </section>
  );
}
