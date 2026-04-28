import type { Project } from '@/data/projects';

const accentMap: Record<Project['accent'], { bg: string; ring: string; text: string }> = {
  lime: { bg: 'bg-accent-lime', ring: 'ring-accent-lime/40', text: 'text-accent-lime' },
  electric: { bg: 'bg-accent-electric', ring: 'ring-accent-electric/40', text: 'text-accent-electric' },
  magenta: { bg: 'bg-accent-magenta', ring: 'ring-accent-magenta/40', text: 'text-accent-magenta' },
};

export default function TimelineGraph({ projects }: { projects: Project[] }) {
  return (
    <section id="workflow" className="relative py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="label-mono">/ flujo</div>
            <h2 className="heading-display text-3xl md:text-5xl mt-3">
              Ruta del desarrollador
            </h2>
            <p className="mt-3 text-white/60 max-w-xl">
              Cada nodo es un sistema. Cada conexión, una decisión. Navega el
              flujo como leerías un grafo: problema → arquitectura →
              aprendizaje.
            </p>
          </div>
          <div className="hidden md:flex chip">
            <span className="w-1.5 h-1.5 bg-accent-lime rounded-full" />
            3 nodos activos
          </div>
        </div>

        <div className="relative glass-strong border-2 border-white/15 shadow-brutal-lg p-6 md:p-10 rounded-lg overflow-hidden">
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <defs>
              <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#c6ff3d" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#3df0ff" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#ff3dd1" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <path
              d="M 8 50 Q 30 20, 50 50 T 92 50"
              stroke="url(#line-grad)"
              strokeWidth="0.4"
              fill="none"
              strokeDasharray="1.2 1.2"
            />
          </svg>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {projects.map((p, i) => {
              const a = accentMap[p.accent];
              return (
                <a
                  key={p.slug}
                  href={`#${p.slug}`}
                  className="group relative block"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className={`relative inline-flex w-4 h-4 ${a.bg} border-2 border-black ring-4 ${a.ring} group-hover:scale-125 transition`}
                    />
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
                      Nodo 0{i + 1}
                    </span>
                    <span className="ml-auto chip uppercase">{p.status}</span>
                  </div>
                  <div className="brutal-dark p-5 group-hover:border-accent-lime/60 group-hover:-translate-y-1 transition">
                    <h3 className={`heading-display text-2xl ${a.text}`}>{p.title}</h3>
                    <p className="mt-2 text-sm text-white/70 leading-relaxed">
                      {p.tagline}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {p.stack.slice(0, 3).map((s) => (
                        <span key={s} className="chip">{s}</span>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3">
                      <span className="font-mono text-[11px] text-white/40 uppercase tracking-wider">
                        explorar →
                      </span>
                      <span className={`font-mono text-xs ${a.text}`}>
                        /{p.slug}
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
