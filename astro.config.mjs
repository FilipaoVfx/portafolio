import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://filipaovfx.dev',
  integrations: [react(), tailwind({ applyBaseStyles: false }), sitemap()],
  output: 'static',
  vite: {
    ssr: { noExternal: ['framer-motion'] },
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client', 'framer-motion'],
    },
  },
});
