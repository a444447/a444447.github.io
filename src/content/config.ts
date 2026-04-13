import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.date(),
      updated: z.date().optional(),
      description: z.string(),
      category: z.enum(['技术', '读书', '生活', '随笔']),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      cover: image().optional(),
    }),
});

export const collections = { posts };
