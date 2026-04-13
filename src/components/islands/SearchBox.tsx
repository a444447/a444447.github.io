import { useEffect, useMemo, useRef, useState } from 'react';

type PagefindResult = {
  id: string;
  data: () => Promise<{
    url: string;
    excerpt: string;
    meta: {
      title?: string;
    };
  }>;
};

type PagefindSearchResult = {
  results: PagefindResult[];
};

type Pagefind = {
  search: (query: string) => Promise<PagefindSearchResult>;
};

type SearchItem = {
  id: string;
  url: string;
  title: string;
  excerpt: string;
};

const MIN_QUERY_LENGTH = 2;
const PAGEFIND_MODULE_PATH = '/_pagefind/pagefind.js';

export default function SearchBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const pagefindRef = useRef<Pagefind | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const normalizedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || normalizedQuery.length < MIN_QUERY_LENGTH) {
      setItems([]);
      setIsLoading(false);
      setError('');
      return;
    }

    let cancelled = false;

    async function runSearch() {
      setIsLoading(true);
      setError('');

      try {
        if (!pagefindRef.current) {
          pagefindRef.current = (await import(/* @vite-ignore */ PAGEFIND_MODULE_PATH)) as Pagefind;
        }

        const search = await pagefindRef.current.search(normalizedQuery);
        const hydratedResults = await Promise.all(search.results.slice(0, 6).map((result) => result.data()));

        if (!cancelled) {
          setItems(
            hydratedResults.map((result, index) => ({
              id: search.results[index].id,
              url: result.url,
              title: result.meta.title || result.url,
              excerpt: result.excerpt,
            })),
          );
        }
      } catch {
        if (!cancelled) {
          setItems([]);
          setError('搜索索引暂不可用。请先运行生产构建生成 Pagefind 索引。');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    const timer = window.setTimeout(runSearch, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isOpen, normalizedQuery]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-[6px] border border-ink-faint px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted transition-all duration-150 ease-out hover:-translate-y-px hover:border-ink-muted hover:text-ink dark:border-night-border dark:text-night-muted dark:hover:border-night-muted dark:hover:text-night-text"
      >
        Search
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-40 px-4 py-20" role="dialog" aria-modal="true" aria-label="站内搜索">
          <button
            type="button"
            aria-label="关闭搜索"
            className="absolute inset-0 h-full w-full cursor-default bg-paper/80 backdrop-blur-sm dark:bg-night/80"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative mx-auto max-w-[720px] overflow-hidden rounded-[8px] border border-ink-faint bg-paper shadow-[0_18px_60px_rgba(31,31,28,0.18)] dark:border-night-border dark:bg-night-surface dark:shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
            <div className="border-b border-ink-faint p-5 dark:border-night-border">
              <div className="mb-3 flex items-center justify-between gap-4">
                <p className="select-none font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-muted dark:text-night-muted">Search</p>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted transition-colors duration-150 hover:text-accent dark:text-night-muted"
                >
                  Esc
                </button>
              </div>
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索文章标题或正文..."
                className="w-full bg-transparent font-news text-[24px] leading-snug text-ink outline-none placeholder:text-ink-faint dark:text-night-text dark:placeholder:text-night-muted"
              />
            </div>

            <div className="max-h-[56vh] overflow-y-auto p-5">
              {normalizedQuery.length < MIN_QUERY_LENGTH && (
                <p className="font-news text-[16.5px] leading-relaxed text-ink-muted dark:text-night-muted">输入至少两个字符开始搜索。</p>
              )}

              {isLoading && (
                <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-muted dark:text-night-muted">Searching...</p>
              )}

              {!isLoading && error && (
                <p className="font-news text-[16.5px] leading-relaxed text-accent">{error}</p>
              )}

              {!isLoading && !error && normalizedQuery.length >= MIN_QUERY_LENGTH && items.length === 0 && (
                <p className="font-news text-[16.5px] leading-relaxed text-ink-muted dark:text-night-muted">没有找到匹配结果。</p>
              )}

              {!isLoading && items.length > 0 && (
                <ol className="space-y-4">
                  {items.map((item) => (
                    <li key={item.id}>
                      <a
                        href={item.url}
                        onClick={() => setIsOpen(false)}
                        className="group block rounded-[8px] border border-transparent p-4 transition-all duration-150 ease-out hover:border-ink-faint hover:bg-[#F6F5F0] dark:hover:border-night-border dark:hover:bg-[#0C0C0A]"
                      >
                        <h2 className="fvar-h3 mb-2 font-fraunces text-[22px] font-semibold leading-[1.3] tracking-tight text-ink transition-colors duration-150 group-hover:text-accent dark:text-night-text">
                          {item.title}
                        </h2>
                        <p
                          className="font-news text-[15.5px] leading-relaxed text-ink-muted dark:text-night-muted"
                          dangerouslySetInnerHTML={{ __html: item.excerpt }}
                        />
                      </a>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
