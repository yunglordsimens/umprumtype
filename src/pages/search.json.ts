import type { APIRoute } from 'astro';
import { getAllTypefaces } from '../lib/typefaces';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const typefaces = getAllTypefaces().map(tf => ({
    type: 'typeface',
    title: tf.title,
    sub: tf.designer !== 'Unknown' ? tf.designer : '',
    url: `/typefaces/${tf.slug}`,
  }));

  const journalEntries = await getCollection('journal');
  const journal = journalEntries.map(e => ({
    type: 'journal',
    title: e.data.title,
    sub: (e.data as any).author || '',
    url: `/journal/${e.id.replace(/\.md$/, '')}`,
  }));

  const projectEntries = await getCollection('projects');
  const projects = projectEntries.map(e => ({
    type: 'project',
    title: e.data.title,
    sub: (e.data as any).author || '',
    url: `/projects/${e.id.replace(/\.md$/, '')}`,
  }));

  return new Response(JSON.stringify([...typefaces, ...journal, ...projects]), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
