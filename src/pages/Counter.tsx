import { useMemo, useState } from 'react';
import { AddStockSheet } from '../components/products/AddStockSheet';
import { ProductFormSheet } from '../components/products/ProductFormSheet';
import { ProductResult } from '../components/products/ProductResult';
import { QuickSell } from '../components/products/QuickSell';
import { SaleBar } from '../components/sale/SaleBar';
import { SalePanel } from '../components/sale/SalePanel';
import { Banner } from '../components/ui/Banner';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Sheet } from '../components/ui/Sheet';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { searchProducts } from '../lib/search';
import { useSale } from '../state/SaleContext';
import { useStore } from '../state/StoreContext';
import type { Product } from '../types';

/** The home screen: search, see the price, add to the sale. */
export default function Counter() {
  const { activeProducts, loaded, loadError } = useStore();
  const sale = useSale();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const [query, setQuery] = useState('');
  const [saleOpen, setSaleOpen] = useState(false);
  const [newProductName, setNewProductName] = useState<string | null>(null);
  const [restocking, setRestocking] = useState<Product | null>(null);

  const results = useMemo(() => searchProducts(activeProducts, query), [activeProducts, query]);
  const quickProducts = useMemo(() => activeProducts.filter((p) => p.is_quick_access), [activeProducts]);
  const searching = query.trim() !== '';
  const canHover = useMediaQuery('(pointer: fine)');

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-10">
      <section aria-label="Find a product" className="min-w-0 space-y-5">
        <div className="relative">
          <input
            type="search"
            aria-label="Search product"
            placeholder="Search product…"
            value={query}
            autoFocus={canHover}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            onChange={(e) => setQuery(e.target.value)}
            className="h-16 w-full rounded border-2 border-ink bg-field pl-4 pr-24 font-display text-2xl font-semibold placeholder:font-medium placeholder:text-ink-soft/60 focus:border-honey-deep [&::-webkit-search-cancel-button]:hidden"
          />
          {searching && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-1 top-1/2 h-12 -translate-y-1/2 px-4 text-[15px] font-bold underline underline-offset-4"
            >
              Clear
            </button>
          )}
        </div>

        {loadError && <Banner tone="error">{loadError}</Banner>}

        {!loaded ? (
          <p className="py-8 text-center text-ink-soft">Loading products…</p>
        ) : activeProducts.length === 0 ? (
          <EmptyState
            title="NO PRODUCTS YET"
            action={
              <Button variant="honey" onClick={() => setNewProductName('')}>
                + ADD PRODUCT
              </Button>
            }
          >
            Add your first product to start using the store system.
          </EmptyState>
        ) : searching ? (
          results.length === 0 ? (
            <EmptyState
              title="NO PRODUCTS FOUND"
              action={
                <Button variant="honey" onClick={() => setNewProductName(query.trim())}>
                  + ADD PRODUCT
                </Button>
              }
            >
              Nothing matches “{query.trim()}”. Add it now and it can be sold right away.
            </EmptyState>
          ) : (
            <ul className="border-t-2 border-line">
              {results.map((product) => (
                <ProductResult
                  key={product.id}
                  product={product}
                  quantityInSale={sale.quantityOf(product.id)}
                  onSetQuantity={(quantity) => sale.setQuantity(product.id, quantity)}
                  onRestock={() => setRestocking(product)}
                />
              ))}
            </ul>
          )
        ) : quickProducts.length > 0 ? (
          <QuickSell products={quickProducts} quantityOf={sale.quantityOf} onAdd={sale.addOne} />
        ) : (
          <p className="py-6 text-ink-soft">
            Type a product name to see its price. Star products on the Products page to pin them here.
          </p>
        )}
      </section>

      {isDesktop ? (
        <aside className="sticky top-4 mt-0 border-2 border-ink bg-field p-4" aria-label="Current sale">
          <SalePanel />
        </aside>
      ) : (
        <>
          <SaleBar onOpen={() => setSaleOpen(true)} />
          {saleOpen && (
            <Sheet title="Current sale" onClose={() => setSaleOpen(false)}>
              <SalePanel showTitle={false} onNextCustomer={() => setSaleOpen(false)} />
            </Sheet>
          )}
        </>
      )}

      {sale.notice && !saleOpen && !isDesktop && (
        <div className="fixed inset-x-0 bottom-[calc(9.5rem+env(safe-area-inset-bottom))] z-30 px-4">
          <Banner tone="info">{sale.notice}</Banner>
        </div>
      )}

      {newProductName !== null && (
        <ProductFormSheet initialName={newProductName} onClose={() => setNewProductName(null)} />
      )}
      {restocking && <AddStockSheet product={restocking} onClose={() => setRestocking(null)} />}
    </div>
  );
}
