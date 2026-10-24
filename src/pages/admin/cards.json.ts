import type { APIRoute } from 'astro';
import { getAllTypefaces } from '../../lib/typefaces';
import { getCollection } from 'astro:content';

// Thumbnails for the admin's grid view: a typeface card shows its preview
// line in the font, a project / journal card its first photo. Keyed by the
// entry slug the admin uses in its URLs.
const short = (t: string, max = 42) => {
  t = t.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), 12)) + '…';
};

export const GET: APIRoute = async () => {
  const typefaces: Record<string, unknown> = {};
  for (const tf of getAllTypefaces()) {
    if (!tf.defaultVariant) continue;
    typefaces[tf.slug] = {
      font: tf.defaultVariant.webPath,
      weight: tf.defaultVariant.weight,
      style: tf.defaultVariant.style,
      text: short(tf.previewText || tf.mainText || tf.title),
    };
  }

  const firstImage = (d: any): string | null => {
    const blockImg = (d.blocks ?? []).find((b: any) => b?.type === 'images')?.items?.[0];
    return d.storeImage || d.gallery?.[0] || blockImg || d.cover || null;
  };
  const images = async (name: 'projects' | 'journal') => {
    const out: Record<string, string> = {};
    for (const e of await getCollection(name)) {
      const img = firstImage(e.data);
      if (img) out[e.id.replace(/\.md$/, '')] = img;
    }
    return out;
  };

  return new Response(
    JSON.stringify({ typefaces, projects: await images('projects'), journal: await images('journal') }),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
  );
};
