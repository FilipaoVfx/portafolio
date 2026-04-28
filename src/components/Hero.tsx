const stackPalette = [
  { color: '#c6ff3d', label: 'Astro · React · TS' },
  { color: '#3df0ff', label: 'Node · Postgres' },
  { color: '#ff3dd1', label: 'Cloudflare · Edge' },
  { color: '#ffb13d', label: 'Supabase +' },
];

const baseUrl = import.meta.env.BASE_URL.replace(/\/?$/, '/');
const assetPath = (path: string) => `${baseUrl}${path.replace(/^\/+/, '')}`;

export default function Hero() {
  return (
    <section className="relative pt-20 md:pt-28 pb-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left — copy */}
          <div className="lg:col-span-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-block w-2 h-2 bg-accent-lime animate-pulse-glow" />
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-white/60">
                Sistemas / Producto / Arquitectura
              </span>
            </div>

            <h1 className="heading-display text-5xl md:text-7xl lg:text-[5.5rem] leading-[0.95]">
              Las apps son funcionalidades.{' '}
              <span className="relative inline-block">
                <span className="relative z-10 bg-accent-lime text-ink-950 px-3 -rotate-1 inline-block border-2 border-black shadow-brutal-lg">
                  Yo construyo
                </span>
              </span>
              <br />
              sistemas
            </h1>

            <div className="mt-8 max-w-2xl space-y-4 text-lg text-white/75 leading-relaxed">
              <p>
                No se trata de escribir código, sino de{' '}
                <span className="text-white font-semibold">
                  tomar decisiones.
                </span>
              </p>
              <p>
                Trabajo en la intersección de{' '}
                <span className="text-accent-lime">arquitectura</span>,{' '}
                <span className="text-accent-electric">producto</span> y{' '}
                <span className="text-accent-magenta">rendimiento</span>,
                construyendo sistemas pensados para escalar desde el día uno.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a href="#projects" className="btn-brutal">
                Ver proyectos →
              </a>
              <a href="#how-i-think" className="btn-ghost">
                Cómo pienso
              </a>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3" aria-label="Stack técnico">
              {stackPalette.map((s) => (
                <div
                  key={s.label}
                  className="group flex items-center gap-2.5"
                  title={s.label}
                >
                  <span
                    className="inline-block w-3 h-3 border-2 border-black transition-transform group-hover:scale-125"
                    style={{
                      backgroundColor: s.color,
                      boxShadow: `0 0 18px ${s.color}55`,
                    }}
                  />
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/55 group-hover:text-white transition">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — profile */}
          <aside className="lg:col-span-4 lg:pt-2">
            <div className="relative max-w-sm mx-auto lg:ml-auto">
              {/* Brutal stacked frame */}
              <div className="absolute inset-0 translate-x-3 translate-y-3 bg-accent-lime border-2 border-black" />
              <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-accent-electric border-2 border-black opacity-80" />

              <div className="relative border-2 border-black bg-ink-900 p-2 shadow-brutal-lg">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={assetPath('/profile.jpg')}
                    alt="Filipao"
                    className="absolute inset-0 w-full h-full object-cover grayscale contrast-110 hover:grayscale-0 transition duration-500"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent pointer-events-none" />

                  {/* HUD overlay */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider">
                    <span className="px-1.5 py-0.5 bg-ink-950/70 border border-white/20 text-white/80">
                      filipao_vfx.exe
                    </span>
                    <span className="flex items-center gap-1.5 px-1.5 py-0.5 bg-ink-950/70 border border-accent-lime/40 text-accent-lime">
                      <span className="w-1.5 h-1.5 bg-accent-lime rounded-full animate-pulse-glow" />
                      en vivo
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 font-mono">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-accent-lime">
                      / operador
                    </div>
                    <div className="text-base text-white font-semibold mt-0.5">
                      Filipao
                    </div>
                  </div>
                </div>

                <div className="mt-2 px-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-white/50">
                  <span>versión · 04.26</span>
                  <span className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-accent-magenta" />
                    <span className="w-1 h-1 bg-accent-electric" />
                    <span className="w-1 h-1 bg-accent-lime" />
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
