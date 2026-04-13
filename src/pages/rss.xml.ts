import type { APIContext, MarkdownInstance } from 'astro';
import rss from '@astrojs/rss';
import { getPublishedPosts } from '../lib/content';
import { SITE } from '../lib/site';

type PostMarkdownModule = MarkdownInstance<Record<string, unknown>>;

const postModules = import.meta.glob<PostMarkdownModule>('../content/posts/**/index.md');

async function getCompiledContentBySlug() {
  const entries = await Promise.all(
    Object.entries(postModules).map(async ([path, load]) => {
      const post = await load();
      const slug = path.match(/..\/content\/posts\/(.+)\/index\.md$/)?.[1];
      return slug ? [slug, post.compiledContent()] : undefined;
    }),
  );

  return new Map(entries.filter(Boolean) as Array<[string, string]>);
}

export async function get(context: APIContext) {
  const posts = await getPublishedPosts();
  const contentBySlug = await getCompiledContentBySlug();

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    trailingSlash: false,
    customData: `<language>${SITE.language}</language>`,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/posts/${post.slug}`,
      content: contentBySlug.get(post.slug),
      categories: [post.data.category, ...post.data.tags],
    })),
  });
}

