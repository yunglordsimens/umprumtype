import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const typefaces = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/typefaces" }),
  schema: z.object({
    name: z.string(),
    author: z.string(),
    authorUrl: z.string().optional(),
    authorInstagram: z.string().optional(),
    authorEmail: z.string().optional(),
    year: z.number(),
    description: z.string(),
    mode: z.enum(["text", "display", "mono", "script"]).default("text"),
    classification: z.string().default("sans"),
    scripts: z.array(z.string()).default(["latin"]),
    fonts: z.array(z.object({
      variant: z.string(),
      file: z.string(),
      style: z.enum(["normal", "italic"]).default("normal"),
      weight: z.number().default(400),
    })).default([]),
    specimens: z.object({
      cs: z.string().optional(),
      en: z.string().optional(),
      de: z.string().optional(),
      uk: z.string().optional(),
    }).optional(),
    tags: z.array(z.string()).default([]),
    tagline: z.string().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(0),
    cover: z.string().optional(),
    purchasable: z.boolean().default(false),
    price: z.string().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    author: z.string().optional(),
    date: z.coerce.date(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    storeImage: z.string().optional(),
    excerpt: z.string().optional(),
    purchasable: z.boolean().default(false),
    contact: z.string().optional(),
    featured: z.boolean().default(false),
    blocks: z.array(z.object({
      type: z.enum(['text', 'images']),
      content: z.string().optional(),
      items: z.array(z.string()).optional(),
    })).optional(),
  }),
});

const journal = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/journal" }),
  schema: z.object({
    title: z.string(),
    author: z.string().optional(),
    date: z.coerce.date(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    storeImage: z.string().optional(),
    excerpt: z.string().optional(),
    purchasable: z.boolean().default(false),
    contact: z.string().optional(),
    featured: z.boolean().default(false),
    blocks: z.array(z.object({
      type: z.enum(['text', 'images']),
      content: z.string().optional(),
      items: z.array(z.string()).optional(),
    })).optional(),
  }),
});

export const collections = { typefaces, projects, journal };
