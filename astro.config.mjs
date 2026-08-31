import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// Un único lugar donde vive la verdad sobre dónde se publica el sitio.
// Producción real hoy = GitHub Pages. `cloudflare` queda listo para el día
// que el dominio propio exista y resuelva.
const targets = {
  'github-pages': { site: 'https://filipaovfx.github.io', base: '/portafolio' },
  cloudflare: { site: 'https://filipaovfx.dev', base: '/' },
};

const target = process.env.DEPLOY_TARGET ?? 'github-pages';
const { site, base } = targets[target] ?? targets['github-pages'];

export default defineConfig({
  site,
  base,
  integrations: [react(), tailwind({ applyBaseStyles: false }), sitemap()],
  output: 'static',
});
