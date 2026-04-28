import { motion } from 'framer-motion';
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

const stackColor: Record<string, string> = {
  // frontend → lime
  Astro: '#c6ff3d',
  React: '#c6ff3d',
  TS: '#c6ff3d',
  TypeScript: '#c6ff3d',
  Tauri: '#c6ff3d',
  // backend → electric
  Node: '#3df0ff',
  Postgres: '#3df0ff',
  WebSockets: '#3df0ff',
  // infra → magenta
  Cloudflare: '#ff3dd1',
  // data / plus → amber
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

  return (
    <motion.article
      id={project.slug}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.55, delay: index * 0.05 }}
      className="scroll-mt-28 mb-24 md:mb-32 last:mb-0"
    >
      <div
        className={`glass-strong border-2 border-white/15 shadow-brutal-lg ${a.shadow} transition-shadow rounded-lg overflow-hidden`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Left rail */}
          <div className="lg:col-span-1 flex lg:flex-col items-center justify-between lg:justify-start lg:py-10 px-8 py-4 border-b lg:border-b-0 lg:border-r border-white/10 bg-black/20">
            <div className={`font-mono text-2xl lg:text-3xl font-bold ${a.text}`}>
              0{index + 1}
            </div>
            <div className="hidden lg:block flex-1 w-px bg-white/10 my-4" />
            <div className={`w-3 h-3 ${a.bg} border-2 border-black`} />
          </div>

          {/* Main */}
          <div className="lg:col-span-7 p-8 md:p-12 lg:p-14">
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
            <p className="mt-3 text-white/70 text-lg max-w-2xl">{project.tagline}</p>

            <div className="mt-8 grid md:grid-cols-2 gap-5">
              <div className="brutal-dark p-5">
                <div className="label-mono mb-2">// problema</div>
                <p className="text-sm leading-relaxed text-white/80">{project.problem}</p>
              </div>
              <div className="brutal-dark p-5">
                <div className="label-mono mb-2">// solución</div>
                <p className="text-sm leading-relaxed text-white/80">{project.solution}</p>
              </div>
            </div>

            <div className="mt-6">
              <div className="label-mono mb-3">// arquitectura</div>
              <ul className="grid md:grid-cols-2 gap-2">
                {project.architecture.map((step, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 px-4 py-2.5 glass border border-white/10 hover:border-white/30 transition"
                  >
                    <span className={`mt-1.5 inline-block w-1.5 h-1.5 ${a.bg}`} />
                    <span className="font-mono text-xs text-white/80 leading-relaxed">
                      {step}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href={`/projects/${project.slug}`} className="btn-brutal">
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

          {/* Preview pane */}
          {project.link && (
            <div className="lg:col-span-4 relative border-t lg:border-t-0 lg:border-l border-white/10 bg-black/30">
              <div className="relative h-full min-h-[320px] lg:min-h-full p-4 md:p-6 flex flex-col">
                <div className="flex items-center justify-between mb-3 font-mono text-[10px] uppercase tracking-wider">
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
                    vista previa
                  </span>
                </div>

                <a
                  href={project.link}
                  target="_blank"
                  rel="noreferrer"
                  className="relative flex-1 block overflow-hidden border-2 border-black bg-ink-950 group/preview"
                  style={{ boxShadow: `4px 4px 0 0 ${a.hex}` }}
                >
                  <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.25em] text-white/30">
                    cargando {project.slug}…
                  </div>
                  <iframe
                    src={project.link}
                    title={`${project.title} preview`}
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin"
                    className="relative w-[200%] h-[200%] origin-top-left scale-50 pointer-events-none bg-ink-950"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-transparent to-transparent opacity-60 group-hover/preview:opacity-30 transition pointer-events-none" />
                  <div className="absolute bottom-3 right-3 chip opacity-0 group-hover/preview:opacity-100 transition">
                    abrir ↗
                  </div>
                </a>

                <div className="mt-3 font-mono text-[10px] uppercase tracking-wider text-white/40 truncate">
                  {project.link.replace(/^https?:\/\//, '')}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
