import { useEffect, useState } from 'react';

export const PAGES = ['home', 'products', 'sales', 'utang', 'stock'] as const;
export type Page = (typeof PAGES)[number];

/** Simple hash routing: #/products, #/stock/history. The Back button works on phones. */
export function useRoute(): { page: Page; sub: string | null } {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const onChange = () => {
      setHash(window.location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const [first, second] = hash.replace(/^#\/?/, '').split('/');
  const page = PAGES.find((p) => p === first) ?? 'home';
  return { page, sub: second || null };
}
