import { getCollection, type CollectionEntry } from 'astro:content';

export type PostEntry = CollectionEntry<'posts'>;

export async function getPublishedPosts(): Promise<PostEntry[]> {
  return (await getCollection('posts'))
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function getAllCategories(posts: PostEntry[]): string[] {
  const order = ['技术', '读书', '生活', '随笔'];
  const set = new Set(posts.map((post) => post.data.category));
  return order.filter((category) => set.has(category));
}

export function getAllTags(posts: PostEntry[]): string[] {
  const set = new Set<string>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      set.add(tag);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-CN'));
}
