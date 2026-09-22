import { type ReactNode } from 'react';
import { PAGES, useRoute, type Page } from '../hooks/useRoute';
import { useAuth } from '../state/AuthContext';
import { Logo } from './Logo';
import { useEffect, useState } from 'react';
import { pendingSaleCount } from '../lib/offline';

const LABELS: Record<Page, string> = {
  home: 'HOME',
  products: 'PRODUCTS',
  sales: 'SALES',
  utang: 'UTANG',
  stock: 'STOCK',
};

const hrefFor = (page: Page) => (page === 'home' ? '#/' : `#/${page}`);

/** Header, page area, and navigation: bottom bar on phones, top links on bigger screens. */
export function Shell({ children }: { children: ReactNode }) {
  const { page } = useRoute();
  const { signOut } = useAuth();
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const refresh = () => { setOnline(navigator.onLine); void pendingSaleCount().then(setPending); };
    refresh();
    window.addEventListener('online', refresh);
    window.addEventListener('offline', refresh);
    const timer = window.setInterval(refresh, 5000);
    return () => { window.removeEventListener('online', refresh); window.removeEventListener('offline', refresh); window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    document.title = page === 'home' ? 'Honey Inventory' : `${LABELS[page][0]}${LABELS[page].slice(1).toLowerCase()} · Honey Inventory`;
  }, [page]);

  return (
    <div className="min-h-dvh">
      <header className="border-b-2 border-ink bg-paper pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <a href="#/" aria-label="Honey Inventory, home">
            <Logo />
          </a>
          <nav aria-label="Main" className="hidden gap-1 md:flex">
            {PAGES.map((p) => (
              <a
                key={p}
                href={hrefFor(p)}
                aria-current={page === p ? 'page' : undefined}
                className={`flex h-11 items-center rounded px-4 font-display text-[15px] font-bold ${
                  page === p ? 'bg-ink text-paper' : 'hover:bg-sand'
                }`}
              >
                {LABELS[p]}
              </a>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => void signOut()}
            className="h-11 rounded px-2 text-[15px] font-semibold underline underline-offset-4 hover:bg-sand"
          >
            Log out
          </button>
        </div>
      </header>

      {!online && (
        <div className="border-b-2 border-ink bg-honey px-4 py-2 text-center font-display text-sm font-bold">OFFLINE MODE · New sales will sync when internet returns{pending ? ` · ${pending} pending` : ''}</div>
      )}
      {online && pending > 0 && (
        <div className="border-b-2 border-ink bg-olive px-4 py-2 text-center font-display text-sm font-bold text-paper">SYNCING {pending} OFFLINE SALE{pending === 1 ? '' : 'S'}…</div>
      )}

      <main className="mx-auto max-w-6xl px-4 pb-52 pt-4 md:pb-12 md:pt-6">{children}</main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 grid h-[calc(4rem+env(safe-area-inset-bottom))] grid-cols-5 border-t-2 border-ink bg-ink pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {PAGES.map((p) => (
          <a
            key={p}
            href={hrefFor(p)}
            aria-current={page === p ? 'page' : undefined}
            className={`flex items-center justify-center border-t-4 px-0.5 font-display text-[13px] font-bold tracking-tight ${
              page === p ? 'border-honey text-honey' : 'border-transparent text-paper/75'
            }`}
          >
            {LABELS[p]}
          </a>
        ))}
      </nav>
    </div>
  );
}
