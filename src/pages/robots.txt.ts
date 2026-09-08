import type { APIRoute } from 'astro';

// robots.txt generado desde la config de deploy: nunca vuelve a apuntar
// a un dominio que no existe.
export const GET: APIRoute = ({ site }) => {
  const canonicalSite = import.meta.env.PUBLIC_CANONICAL_SITE;
  const base = canonicalSite ? '/' : import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const sitemapUrl = new URL(
    `${base}sitemap-index.xml`.replace(/^\/+/, ''),
    canonicalSite || site,
  ).href;

  return new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
};
