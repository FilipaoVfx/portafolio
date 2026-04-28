import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

const isGitHubPages = process.env.DEPLOY_TARGET === 'github-pages';

export default defineConfig({
  site: isGitHubPages ? 'https://filipaovfx.github.io' : 'https://filipaovfx.dev',
  base: isGitHubPages ? '/portafolio' : '/',
  integrations: [react(), tailwind({ applyBaseStyles: false }), sitemap()],
  output: 'static',
  vite: {
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client'],
    },
  },
});
