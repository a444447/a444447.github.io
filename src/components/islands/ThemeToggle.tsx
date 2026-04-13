import { useEffect, useMemo, useState } from 'react';

type Theme = 'light' | 'dark';
const THEME_KEY = 'theme';

function getThemeFromDom(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(getThemeFromDom());
  }, []);

  const nextTheme = useMemo<Theme>(() => (theme === 'dark' ? 'light' : 'dark'), [theme]);

  const label = theme === 'dark' ? '☀ Light' : '◑ Dark';

  const onToggle = () => {
    const root = document.documentElement;
    root.classList.toggle('dark', nextTheme === 'dark');
    localStorage.setItem(THEME_KEY, nextTheme);
    setTheme(nextTheme);
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${nextTheme} theme`}
      className="flex items-center gap-2 rounded-[6px] border border-ink-faint px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted transition-all duration-150 ease-out hover:-translate-y-px hover:border-ink-muted hover:text-ink dark:border-night-border dark:text-night-muted dark:hover:border-night-muted dark:hover:text-night-text"
    >
      {label}
    </button>
  );
}
