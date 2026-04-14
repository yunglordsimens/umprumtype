import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
  const base = (site ?? new URL('https://typoumprum.cz')).toString().replace(/\/$/, '');
  const slugOf = (e: any) => e.id.replace(/\.md$/, '');

  const [typefaces, projects, journal] = await Promise.all([
    getCollection('typefaces'),
    getCollection('projects'),
    getCollection('journal'),
  ]);

  const urls: string[] = [
    '/',
    '/typefaces',
    '/projects',
    '/journal',
    '/store',
    '/info',
    ...typefaces.map((t) => `/typefaces/${slugOf(t)}`),
    ...projects.map((p) => `/projects/${slugOf(p)}`),
    ...journal.map((j) => `/journal/${slugOf(j)}`),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${base}${u}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
