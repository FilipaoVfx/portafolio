import type { APIRoute } from 'astro';
import { getSystemMap, systemMapSlugs } from '@/lib/system-map';

// El artefacto validado. La tarjeta de proyecto lo pide al girarse; así la
// home no carga ningún mapa hasta que alguien lo quiere ver.
export function getStaticPaths() {
  return systemMapSlugs().map((slug) => ({ params: { slug } }));
}

export const GET: APIRoute = ({ params }) =>
  new Response(JSON.stringify(getSystemMap(params.slug!)), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
