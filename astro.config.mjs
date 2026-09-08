import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// Un único lugar donde vive la verdad sobre dónde se publica el sitio.
// Producción = Cloudflare Workers (assets estáticos). El target github-pages
// queda para builds
// de respaldo servidas bajo /portafolio.
const targets = {
  'github-pages': { site: 'https://filipaovfx.github.io', base: '/portafolio' },
  cloudflare: {
    // Dominio propio vinculado en Cloudflare. DEPLOY_SITE lo sobrescribe para
    // previews de rama, donde el host es el *.workers.dev del deployment.
    site: process.env.DEPLOY_SITE ?? 'https://juangonzalezdev.xyz',
    base: '/',
  },
};

const target = process.env.DEPLOY_TARGET ?? 'cloudflare';
const { site, base } = targets[target] ?? targets.cloudflare;

export default defineConfig({
  site,
  base,
  integrations: [react(), tailwind({ applyBaseStyles: false }), sitemap()],
  output: 'static',
});
