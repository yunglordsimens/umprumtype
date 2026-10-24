import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// Only real, indexable pages. Typefaces and projects live as anchors on their
// archive pages (/typefaces#slug, /projects#slug) — their slug URLs are just
// redirects, so they stay out of the sitemap.
export const GET: APIRoute = async ({ site }) => {
  const base = (site ?? new URL('https://typoumprum.cz')).toString().replace(/\/$/, '');
  const slugOf = (e: any) => e.id.replace(/\.md$/, '');
  const day = (d: Date) => d.toISOString().slice(0, 10);

  const journal = await getCollection('journal');
  const latest = journal.reduce<Date | null>(
    (m, j) => (!m || j.data.date > m ? j.data.date : m),
    null,
  );

  const urls: { loc: string; lastmod?: string }[] = [
    { loc: '/' },
    { loc: '/typefaces' },
    { loc: '/projects' },
    { loc: '/journal', lastmod: latest ? day(latest) : undefined },
    { loc: '/library' },
    { loc: '/store' },
    { loc: '/info' },
    ...journal.map((j) => ({ loc: `/journal/${slugOf(j)}`, lastmod: day(j.data.date) })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url><loc>${base}${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`)
  .join('\n')}
</urlset>`;

  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
