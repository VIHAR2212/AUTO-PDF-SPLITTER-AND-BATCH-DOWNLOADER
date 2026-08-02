import { useEffect } from 'react';
import type { Theme } from '@/types';

export function useTheme(theme: Theme) {
  useEffect(() => {
    const root = document.documentElement;
    const apply = (dark: boolean) => root.classList.toggle('dark', dark);

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      apply(mq.matches);
      const listener = (e: MediaQueryListEvent) => apply(e.matches);
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }

    apply(theme === 'dark');
  }, [theme]);
}
