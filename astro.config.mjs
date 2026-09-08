import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// Un único lugar donde vive la verdad sobre dónde se publica el sitio.
// Producción = Cloudflare Pages. El target github-pages queda para builds
// de respaldo servidas bajo /portafolio.
const targets = {
  'github-pages': { site: 'https://filipaovfx.github.io', base: '/portafolio' },
  cloudflare: {
    // Cloudflare Pages inyecta CF_PAGES_URL en cada build (producción y preview),
    // así canonical y sitemap salen con el host real sin tocar código.
    site: process.env.DEPLOY_SITE ?? process.env.CF_PAGES_URL ?? 'https://filipaovfx.dev',
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
