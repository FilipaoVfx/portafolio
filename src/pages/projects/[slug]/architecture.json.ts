import type { APIRoute } from 'astro';
import { getSystemMap, systemMapSlugs } from '@/lib/system-map';

// El artefacto validado, publicado tal cual para quien quiera auditarlo.
export function getStaticPaths() {
  return systemMapSlugs().map((slug) => ({ params: { slug } }));
}

export const GET: APIRoute = ({ params }) =>
  new Response(JSON.stringify(getSystemMap(params.slug!), null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
