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
                className={`achievement-paper group relative overflow-hidden border-2 border-white/18 bg-ink-900 p-2.5 shadow-[10px_12px_0_0_rgba(0,0,0,0.78)] transition duration-300 hover:rotate-0 hover:-translate-y-1 ${item.className}`}
              >
                <div className="relative overflow-hidden border border-white/10 bg-ink-950">
                  <img
                    src={assetPath(item.src)}
                    alt={item.alt}
                    loading="lazy"
                    className={`h-full min-h-[220px] w-full object-cover opacity-90 contrast-110 saturate-[0.92] transition duration-500 group-hover:scale-[1.015] group-hover:opacity-100 ${item.imageClassName ?? ''}`}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(61,240,255,0.12),transparent_30%,rgba(0,0,0,0.46)_82%)] mix-blend-soft-light" />
                  <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.035)_0_1px,transparent_1px_6px)] opacity-45" />
                </div>
                <figcaption className="flex flex-col gap-1 border-t border-white/10 bg-ink-950 px-3 py-3 text-white sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-electric/80">
                    {item.eyebrow}
                  </span>
                  <span className="heading-display text-lg leading-none text-white/90">
                    {item.title}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-l-2 border-accent-lime/70 pl-5 text-white/72 md:flex-row md:items-center md:justify-between">
          <p className="max-w-3xl leading-relaxed">
            La competencia fue realizada el 21 de noviembre de 2025 en Armenia,
            Quindio.
          </p>
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-accent-electric">
            1er puesto
          </div>
        </div>
      </div>
    </section>
  );
}
