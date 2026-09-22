import { useMemo, useState } from 'react';
import { applyStockCounts, fetchMovements } from '../db/stock';
import { AddStockSheet } from '../components/products/AddStockSheet';
import { Banner } from '../components/ui/Banner';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { inputClass } from '../components/ui/Fields';
import { Tag } from '../components/ui/Tag';
import { useLoad } from '../hooks/useLoad';
import { useRoute } from '../hooks/useRoute';
import { formatDayTime } from '../lib/dates';
import { messageOf } from '../lib/errors';
import { parseWholeNumber } from '../lib/money';
import { searchProducts } from '../lib/search';
import { COUNT_REASONS, isOutOfStock, needsRestock } from '../lib/stock';
import { useStore } from '../state/StoreContext';
import { useToast } from '../state/ToastContext';
import type { Product, StockMovement } from '../types';

export default function Stock() {
  const { sub } = useRoute();
  const tab = sub === 'low' || sub === 'history' ? sub : 'count';
  const { activeProducts } = useStore();
  const lowCount = activeProducts.filter(needsRestock).length;

  const tabs = [
    { id: 'count', label: 'Count', href: '#/stock' },
    { id: 'low', label: `Low stock (${lowCount})`, href: '#/stock/low' },
    { id: 'history', label: 'History', href: '#/stock/history' },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-3xl font-extrabold">Stock</h1>
      <nav className="grid grid-cols-3 border-2 border-ink" aria-label="Stock sections">
        {tabs.map((t) => (
          <a
            key={t.id}
            href={t.href}
            aria-current={tab === t.id ? 'page' : undefined}
            className={`flex h-12 items-center justify-center whitespace-nowrap px-1 text-center font-display text-[14px] font-bold ${
              tab === t.id ? 'bg-ink text-paper' : 'bg-field hover:bg-sand'
            }`}
          >
            {t.label}
          </a>
        ))}
      </nav>
      {tab === 'count' && <PhysicalCount />}
      {tab === 'low' && <LowStock />}
      {tab === 'history' && <History />}
    </div>
  );
}

/** End-of-day count: type only what you counted. Everything else stays as is. */
function PhysicalCount() {
  const { activeProducts, reloadProducts } = useStore();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [actuals, setActuals] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useMemo(
    () => (query.trim() === '' ? activeProducts : searchProducts(activeProducts, query)),
    [activeProducts, query],
  );

  const changes = activeProducts
    .map((product) => {
      const counted = parseWholeNumber(actuals[product.id] ?? '');
      return counted !== null && counted !== product.stock_quantity ? { product, counted } : null;
    })
    .filter((c): c is { product: Product; counted: number } => c !== null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await applyStockCounts(
        changes.map((c) => ({
          productId: c.product.id,
          actual: c.counted,
          reason: reasons[c.product.id] ?? COUNT_REASONS[0],
        })),
      );
      await reloadProducts();
      setActuals({});
      setReasons({});
      toast('STOCK ADJUSTED');
    } catch (e) {
      setError(messageOf(e, 'Something went wrong while adjusting stock. Nothing was changed.'));
    } finally {
      setSaving(false);
    }
  }

  if (activeProducts.length === 0) {
    return (
      <EmptyState title="NO PRODUCTS YET">Add your first product to start using the store system.</EmptyState>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-display text-2xl font-bold">Physical count</h2>
        <p className="text-ink-soft">Count the shelf and type the number. Skip anything you didn't count.</p>
      </div>
      <input
        type="search"
        aria-label="Search products to count"
        placeholder="Search products…"
        value={query}
        autoComplete="off"
        onChange={(e) => setQuery(e.target.value)}
        className="h-14 w-full rounded border-2 border-ink bg-field px-4 text-lg placeholder:text-ink-soft/60 focus:border-honey-deep"
      />

      <ul className="border-t-2 border-line">
        {list.map((product) => {
          const counted = parseWholeNumber(actuals[product.id] ?? '');
          const diff = counted === null ? null : counted - product.stock_quantity;
          return (
            <li key={product.id} className={`border-b-2 border-line px-2 py-3 ${diff ? 'bg-honey-wash' : ''}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold leading-tight">{product.name}</p>
                  <p className="text-[15px] text-ink-soft">
                    Expected: <b className="tabular-nums text-ink">{product.stock_quantity}</b>
                  </p>
                </div>
                <label className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold">Actual</span>
                  <input
                    inputMode="numeric"
                    aria-label={`Actual count of ${product.name}`}
                    value={actuals[product.id] ?? ''}
                    onChange={(e) => {
                      setActuals((a) => ({ ...a, [product.id]: e.target.value.replace(/\D/g, '').slice(0, 5) }));
                      setError(null);
                    }}
                    className="h-12 w-20 rounded border-2 border-ink bg-field text-center font-display text-2xl font-extrabold tabular-nums focus:border-honey-deep"
                  />
                </label>
              </div>
              {diff !== null && (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  {diff === 0 ? (
                    <Tag tone="ok">Matches</Tag>
                  ) : (
                    <>
                      <p className="font-display text-lg font-bold text-brick tabular-nums">
                        Difference: {diff > 0 ? `+${diff}` : diff}
                      </p>
                      <select
                        aria-label={`Reason for ${product.name}`}
                        className={`${inputClass} h-11 w-auto text-base`}
                        value={reasons[product.id] ?? COUNT_REASONS[0]}
                        onChange={(e) => setReasons((r) => ({ ...r, [product.id]: e.target.value }))}
                      >
                        {COUNT_REASONS.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
        {list.length === 0 && <li className="py-6 text-center text-ink-soft">No products match “{query.trim()}”.</li>}
      </ul>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] -mx-4 space-y-2 border-t-2 border-ink bg-paper px-4 py-3 md:bottom-0">
        {error && <Banner tone="error">{error}</Banner>}
        <Button variant="honey" size="lg" full disabled={changes.length === 0 || saving} onClick={save}>
          {saving
            ? 'SAVING…'
            : changes.length === 0
              ? 'ADJUST STOCK'
              : `ADJUST STOCK · ${changes.length} ${changes.length === 1 ? 'change' : 'changes'}`}
        </Button>
        {changes.length === 0 && (
          <p className="text-center text-sm text-ink-soft">Enter a count that is different from Expected to adjust.</p>
        )}
      </div>
    </div>
  );
}

function LowStock() {
  const { activeProducts } = useStore();
  const [restocking, setRestocking] = useState<Product | null>(null);
  const low = useMemo(
    () => activeProducts.filter(needsRestock).sort((a, b) => a.stock_quantity - b.stock_quantity || a.name.localeCompare(b.name)),
    [activeProducts],
  );

  if (low.length === 0) {
    return <EmptyState title="ALL STOCK LOOKS GOOD">Nothing is running low.</EmptyState>;
  }

  return (
    <div className="space-y-3">
      <h2 className="font-display text-2xl font-bold">Low stock</h2>
      <ul className="border-t-2 border-line">
        {low.map((product) => (
          <li key={product.id} className="flex items-center justify-between gap-3 border-b-2 border-line px-2 py-3">
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold leading-tight">{product.name}</p>
              <p className="mt-0.5 flex items-center gap-2 text-[15px] font-semibold text-brick">
                {isOutOfStock(product) ? 'Out of stock' : `${product.stock_quantity} left`}
                <span className="font-normal text-ink-soft">· low at {product.low_stock_threshold}</span>
              </p>
            </div>
            <Button size="sm" onClick={() => setRestocking(product)}>
              + ADD STOCK
            </Button>
          </li>
        ))}
      </ul>
      {restocking && <AddStockSheet product={restocking} onClose={() => setRestocking(null)} />}
    </div>
  );
}

const movementTone = { SALE: 'neutral', RESTOCK: 'ok', ADJUSTMENT: 'honey' } as const;

function History() {
  const movements = useLoad(() => fetchMovements(100), []);

  if (movements.error) return <Banner tone="error">{movements.error}</Banner>;
  if (movements.loading && !movements.data) return <p className="py-6 text-center text-ink-soft">Loading history…</p>;
  if (!movements.data || movements.data.length === 0) {
    return <EmptyState title="NO STOCK ACTIVITY YET">Sales, restocks and adjustments will show up here.</EmptyState>;
  }

  return (
    <div className="space-y-3">
      <h2 className="font-display text-2xl font-bold">Stock history</h2>
      <ul className="border-t-2 border-line">
        {movements.data.map((m) => (
          <MovementRow key={m.id} movement={m} />
        ))}
      </ul>
    </div>
  );
}

function MovementRow({ movement: m }: { movement: StockMovement }) {
  const expected = m.stock_after - m.quantity;
  return (
    <li className="flex items-start justify-between gap-3 border-b-2 border-line px-2 py-3">
      <div className="min-w-0">
        <Tag tone={movementTone[m.type]}>{m.type}</Tag>
        <p className="mt-1 font-display text-lg font-semibold leading-tight">{m.product?.name ?? 'Removed product'}</p>
        <p className="text-sm text-ink-soft">
          {formatDayTime(m.created_at)}
          {m.type === 'ADJUSTMENT' && ` · Expected ${expected}, actual ${m.stock_after}`}
          {m.reason && m.reason !== 'Sale' && m.reason !== 'Restock' && ` · ${m.reason}`}
        </p>
      </div>
      <p className={`font-display text-3xl font-extrabold tabular-nums ${m.quantity > 0 ? 'text-olive' : 'text-ink'}`}>
        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
      </p>
    </li>
  );
}
