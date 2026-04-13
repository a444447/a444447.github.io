import type { CollectionEntry } from 'astro:content';

interface Props {
  post: CollectionEntry<'posts'>;
}

export default function PostCard({ post }: Props) {
  const postUrl = `/posts/${post.slug}`;
  const dateLabel = post.data.date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return (
    <article className="group cursor-pointer rounded-[8px] border border-ink-faint p-8 transition-all duration-150 ease-out hover:border-ink-muted hover:shadow-[0_2px_16px_rgba(0,0,0,0.05)] dark:border-night-border dark:hover:border-night-muted dark:hover:shadow-[0_2px_16px_rgba(0,0,0,0.35)]">
      <a href={postUrl} className="block">
        <div className="mb-5 flex items-center gap-3">
          <span className="rounded-[5px] border border-accent/30 px-1.5 py-[2px] font-mono text-[9.5px] uppercase leading-none tracking-[0.11em] text-accent">
            {post.data.category}
          </span>
          <time className="font-news text-sm text-ink-muted dark:text-night-muted" dateTime={post.data.date.toISOString()}>
            {dateLabel}
          </time>
        </div>
        <h3 className="fvar-h3 mb-3 font-fraunces text-[24px] font-semibold leading-[1.3] tracking-tight text-ink transition-colors duration-150 ease-out group-hover:text-accent dark:text-night-text">
          {post.data.title}
        </h3>
        <p className="font-news text-[16.5px] leading-relaxed text-ink-muted dark:text-night-muted">{post.data.description}</p>
      </a>
    </article>
  );
}
