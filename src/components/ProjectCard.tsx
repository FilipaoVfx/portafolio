import type { Project } from '@/data/projects';

const accentMap: Record<Project['accent'], { bg: string; text: string; shadow: string; hex: string }> = {
  lime: { bg: 'bg-accent-lime', text: 'text-accent-lime', shadow: 'hover:shadow-glow', hex: '#c6ff3d' },
  electric: { bg: 'bg-accent-electric', text: 'text-accent-electric', shadow: 'hover:shadow-glow-cyan', hex: '#3df0ff' },
  magenta: { bg: 'bg-accent-magenta', text: 'text-accent-magenta', shadow: 'hover:shadow-[0_0_40px_rgba(255,61,209,0.35)]', hex: '#ff3dd1' },
};

const statusLabel: Record<Project['status'], string> = {
  live: 'en vivo',
  beta: 'beta',
  wip: 'en proceso',
};

const baseUrl = import.meta.env.BASE_URL.replace(/\/?$/, '/');
const routePath = (path: string) => `${baseUrl}${path.replace(/^\/+/, '')}`;
const assetPath = (path: string) => `${baseUrl}${path.replace(/^\/+/, '')}`;

const stackColor: Record<string, string> = {
  Astro: '#c6ff3d',
  React: '#c6ff3d',
  TS: '#c6ff3d',
  TypeScript: '#c6ff3d',
  Tauri: '#c6ff3d',
  Node: '#3df0ff',
  Postgres: '#3df0ff',
  WebSockets: '#3df0ff',
  Cloudflare: '#ff3dd1',
  Supabase: '#ffb13d',
  pgvector: '#ffb13d',
  'D3.js': '#ffb13d',
  Sharp: '#ffb13d',
};

function chipColor(s: string) {
  return stackColor[s] ?? '#ffffff';
}

export default function ProjectCard({ project, index }: { project: Project; index: number }) {
  const a = accentMap[project.accent];
  const displayUrl = project.link?.replace(/^https?:\/\//, '') ?? '';

  return (
    <article
      id={project.slug}
      className="scroll-mt-28 mb-24 md:mb-32 last:mb-0"
    >
      <div
        className={`glass-strong border-2 border-white/15 shadow-brutal-lg ${a.shadow} transition-shadow rounded-lg overflow-hidden`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          <div className="lg:col-span-1 flex lg:flex-col items-center justify-between lg:justify-start lg:py-10 px-8 py-4 border-b lg:border-b-0 lg:border-r border-white/10 bg-black/20">
            <div className={`font-mono text-2xl lg:text-3xl font-bold ${a.text}`}>
              0{index + 1}
            </div>
            <div className="hidden lg:block flex-1 w-px bg-white/10 my-4" />
            <div className={`w-3 h-3 ${a.bg} border-2 border-black`} />
          </div>

          <div className="lg:col-span-5 p-6 md:p-9 lg:p-10 xl:p-12 flex flex-col">
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="chip uppercase">{statusLabel[project.status]}</span>
              {project.stack.map((s) => (
                <span
                  key={s}
                  className="chip"
                  style={{
                    borderColor: `${chipColor(s)}55`,
                    color: chipColor(s),
                  }}
                >
                  <span
                    className="inline-block w-1.5 h-1.5"
                    style={{ backgroundColor: chipColor(s) }}
                  />
                  {s}
                </span>
              ))}
            </div>

            <h3 className={`heading-display text-3xl md:text-5xl ${a.text}`}>
              {project.title}
            </h3>
            <p className="mt-3 text-white/70 text-base md:text-lg leading-relaxed">
              {project.tagline}
            </p>

            <div className="mt-8">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="label-mono">// arquitectura</div>
                <div
                  className="hidden sm:block h-px flex-1"
                  style={{ backgroundColor: `${a.hex}55` }}
                />
              </div>
              <ul className="grid gap-2">
                {project.architecture.map((step, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 px-3.5 py-2.5 glass border border-white/10 hover:border-white/30 transition"
                  >
                    <span className={`mt-1.5 inline-block w-1.5 h-1.5 ${a.bg}`} />
                    <span className="font-mono text-xs text-white/80 leading-relaxed">
                      {step}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 lg:mt-auto lg:pt-8">
              <a href={routePath(`/projects/${project.slug}`)} className="btn-brutal">
                Ver caso completo →
              </a>
              {project.link && (
                <a href={project.link} className="btn-ghost" target="_blank" rel="noreferrer">
                  Ver demo ↗
                </a>
              )}
              {project.repo && (
                <a href={project.repo} className="btn-ghost" target="_blank" rel="noreferrer">
                  Código ↗
                </a>
              )}
            </div>
          </div>

          {project.link && (
            <div className="lg:col-span-6 relative border-t lg:border-t-0 lg:border-l border-white/10 bg-black/25">
              <div className="relative h-full p-4 md:p-6 lg:p-8 xl:p-10 flex flex-col justify-center">
                <a
                  href={project.link}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Abrir demo de ${project.title}`}
                  className="group/preview block w-[calc(100%-4px)] rounded-md border border-white/15 bg-ink-950/95 p-2.5 shadow-[0_18px_55px_rgba(0,0,0,0.34)] transition hover:border-white/35"
                  style={{ boxShadow: `4px 4px 0 0 ${a.hex}` }}
                >
                  <div className="flex items-center justify-between px-1 pb-2 font-mono text-[10px] uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-accent-magenta" />
                      <span className="w-2 h-2 rounded-full bg-accent-amber" />
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: a.hex }}
                      />
                    </div>
                    <span
                      className="px-1.5 py-0.5 border"
                      style={{ borderColor: `${a.hex}55`, color: a.hex }}
                    >
                      demo
                    </span>
                  </div>

                  <div className="relative aspect-[16/10] lg:aspect-[16/11] xl:aspect-[16/10] overflow-hidden rounded border border-white/10 bg-black">
                    {project.previewImage ? (
                      <img
                        src={assetPath(project.previewImage)}
                        alt={`Captura de ${project.title}`}
                        loading={index === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                        sizes="(min-width: 1280px) 520px, (min-width: 1024px) 48vw, 100vw"
                        className="h-full w-full object-cover object-top transition duration-500 group-hover/preview:scale-[1.025]"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:22px_22px] opacity-40" />
                    )}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <div className={`font-mono text-[10px] uppercase tracking-[0.2em] ${a.text}`}>
                          captura real
                        </div>
                        <div className="mt-1 truncate text-xs font-mono text-white/55">
                          {displayUrl}
                        </div>
                      </div>
                      <span className="chip shrink-0">abrir ↗</span>
                    </div>
                  </div>
                </a>

                <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 font-mono text-[10px] uppercase tracking-wider text-white/45">
                  <div className="glass px-3 py-2">
                    <span className={a.text}>estado</span>
                    <div className="mt-1 text-white/70">{statusLabel[project.status]}</div>
                  </div>
                  <div className="glass px-3 py-2">
                    <span className={a.text}>stack</span>
                    <div className="mt-1 text-white/70">{project.stack.slice(0, 2).join(' + ')}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
