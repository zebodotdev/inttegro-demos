import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = () => Response.json(
  { status: 'ok', demo: 'astro' },
  { headers: { 'Cache-Control': 'no-store' } },
);
