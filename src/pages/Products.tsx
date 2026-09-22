import { useMemo, useState } from 'react';
import { removeDemoData, updateProduct } from '../db/products';
import { AddStockSheet } from '../components/products/AddStockSheet';
import { AdjustStockSheet } from '../components/products/AdjustStockSheet';
import { ProductFormSheet } from '../components/products/ProductFormSheet';
import { Banner } from '../components/ui/Banner';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Money } from '../components/ui/Money';
import { Tag } from '../components/ui/Tag';
import { messageOf } from '../lib/errors';
import { searchProducts } from '../lib/search';
import { isLowButAvailable, isOutOfStock, MAX_QUICK_SELL, needsRestock, stockLabel } from '../lib/stock';
import { useStore } from '../state/StoreContext';
import { useToast } from '../state/ToastContext';
import type { Product } from '../types';

type Filter = 'all' | 'low' | 'archived';

export default function Products() {
  const { products, productsById, customers, reload, reloadProducts } = useStore();
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addStockId, setAddStockId] = useState<string | null>(null);
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmingDemo, setConfirmingDemo] = useState(false);

  const active = useMemo(() => products.filter((p) => p.is_active), [products]);
  const archived = useMemo(() => products.filter((p) => !p.is_active), [products]);
  const lowCount = active.filter(needsRestock).length;
  const quickCount = active.filter((p) => p.is_quick_access).length;
  const hasDemo = products.some((p) => p.is_demo) || customers.some((c) => c.is_demo);

  const visible = useMemo(() => {
    const pool = filter === 'archived' ? archived : filter === 'low' ? active.filter(needsRestock) : active;
    return query.trim() === '' ? pool : searchProducts(pool, query);
  }, [filter, query, active, archived]);

  async function toggleQuick(product: Product) {
    if (!product.is_quick_access && quickCount >= MAX_QUICK_SELL) {
      return setMessage(`Quick sell is full (${MAX_QUICK_SELL} products). Turn one off first.`);
    }
    setMessage(null);
    try {
      await updateProduct(product.id, { is_quick_access: !product.is_quick_access });
      await reloadProducts();
    } catch (e) {
      setMessage(messageOf(e, 'Something went wrong while saving.'));
    }
  }

  async function clearDemo() {
    try {
      await removeDemoData();
      await reload();
      toast('DEMO DATA REMOVED');
    } catch (e) {
      setMessage(messageOf(e, 'Something went wrong while removing the demo data.'));
    }
    setConfirmingDemo(false);
  }

  const editing = editingId ? productsById.get(editingId) : undefined;
  const addStockFor = addStockId ? productsById.get(addStockId) : undefined;
  const adjustFor = adjustId ? productsById.get(adjustId) : undefined;

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: `All (${active.length})` },
    { id: 'low', label: `Low stock (${lowCount})` },
    { id: 'archived', label: `Archived (${archived.length})` },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold">Products</h1>
        <Button variant="honey" onClick={() => setAdding(true)}>
          + ADD PRODUCT
        </Button>
      </div>

      {hasDemo && (
        <div className="space-y-2 border-2 border-honey bg-honey-wash p-3">
          <p className="font-semibold">Some products and customers here are demo data.</p>
          <p className="text-[15px]">They are marked DEMO. Remove them before you start using the real store records.</p>
          {confirmingDemo ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="danger" size="sm" onClick={clearDemo}>
                Yes, remove demo data
              </Button>
              <Button size="sm" onClick={() => setConfirmingDemo(false)}>
                Keep for now
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => setConfirmingDemo(true)}>
              Remove demo data
            </Button>
          )}
        </div>
      )}

      <input
        type="search"
        aria-label="Search products"
        placeholder="Search products…"
        value={query}
        autoComplete="off"
        onChange={(e) => setQuery(e.target.value)}
        className="h-14 w-full rounded border-2 border-ink bg-field px-4 text-lg placeholder:text-ink-soft/60 focus:border-honey-deep"
      />

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter products">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`h-11 rounded border-2 border-ink px-3 font-display text-[14px] font-bold ${
              filter === f.id ? 'bg-ink text-paper' : 'bg-field hover:bg-sand'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {message && <Banner tone="error">{message}</Banner>}

      {products.length === 0 ? (
        <EmptyState
          title="NO PRODUCTS YET"
          action={
            <Button variant="honey" onClick={() => setAdding(true)}>
              + ADD PRODUCT
            </Button>
          }
        >
          Add your first product to start using the store system.
        </EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState title={filter === 'low' && query === '' ? 'ALL STOCK LOOKS GOOD' : 'NO PRODUCTS FOUND'}>
          {filter === 'low' && query === '' ? 'Nothing is running low.' : 'Try a different name.'}
        </EmptyState>
      ) : (
        <ul className="border-t-2 border-line">
          {visible.map((product) => (
            <li key={product.id} className="flex items-stretch border-b-2 border-line">
              <button
                type="button"
                onClick={() => setEditingId(product.id)}
                className="min-w-0 flex-1 px-2 py-3 text-left hover:bg-sand"
                aria-label={`Edit ${product.name}`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0 font-display text-lg font-semibold leading-tight">{product.name}</span>
                  <Money value={product.selling_price} className="text-3xl" />
                </span>
                <span className="mt-1.5 flex flex-wrap items-center gap-2 text-[15px] font-medium">
                  <span className={isOutOfStock(product) || isLowButAvailable(product) ? 'text-brick' : 'text-olive'}>
                    {stockLabel(product)}
                  </span>
                  {product.is_active && isOutOfStock(product) && <Tag tone="warn">OUT OF STOCK</Tag>}
                  {product.is_active && isLowButAvailable(product) && <Tag tone="warn">LOW STOCK</Tag>}
                  {!product.is_active && <Tag>ARCHIVED</Tag>}
                  {product.is_demo && <Tag tone="honey">DEMO</Tag>}
                </span>
              </button>
              {product.is_active && (
                <button
                  type="button"
                  onClick={() => toggleQuick(product)}
                  aria-pressed={product.is_quick_access}
                  aria-label={product.is_quick_access ? `Remove ${product.name} from Quick sell` : `Add ${product.name} to Quick sell`}
                  className={`w-14 shrink-0 text-2xl ${product.is_quick_access ? 'text-honey-deep' : 'text-ink-soft/50'} hover:bg-sand`}
                >
                  {product.is_quick_access ? '★' : '☆'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-ink-soft">
        ★ puts a product in Quick sell on the home screen ({quickCount} of {MAX_QUICK_SELL}).
      </p>

      {adding && <ProductFormSheet onClose={() => setAdding(false)} />}
      {editing && (
        <ProductFormSheet
          product={editing}
          onClose={() => setEditingId(null)}
          onAddStock={() => setAddStockId(editing.id)}
          onAdjustStock={() => setAdjustId(editing.id)}
        />
      )}
      {addStockFor && <AddStockSheet product={addStockFor} onClose={() => setAddStockId(null)} />}
      {adjustFor && <AdjustStockSheet product={adjustFor} onClose={() => setAdjustId(null)} />}
    </div>
  );
}
