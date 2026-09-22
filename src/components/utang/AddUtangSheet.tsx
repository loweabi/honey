import { useMemo, useState } from 'react';
import { addUtangItems, type UtangItemInput } from '../../db/customers';
import { messageOf } from '../../lib/errors';
import { formatPeso, parseAmount, parseWholeNumber } from '../../lib/money';
import { searchProducts } from '../../lib/search';
import { nameOf, subtotalOf, totalOf, type UtangLine } from '../../lib/utang-items';
import { useStore } from '../../state/StoreContext';
import { useToast } from '../../state/ToastContext';
import type { Customer, Product } from '../../types';
import { Banner } from '../ui/Banner';
import { Button } from '../ui/Button';
import { inputClass, MoneyField, NumberField, TextField } from '../ui/Fields';
import { Money } from '../ui/Money';
import { Sheet } from '../ui/Sheet';
import { Stepper } from '../ui/Stepper';

function TrashIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

/**
 * Add utang for one customer, item by item: pick a product (price comes
 * from the catalog, stock goes down) or type in something not on the list
 * (name, price, pieces — no stock effect).
 */
export function AddUtangSheet({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const { activeProducts, reload } = useStore();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [lines, setLines] = useState<UtangLine[]>([]);
  const [addingCustom, setAddingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customQty, setCustomQty] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const results = useMemo(
    () => (query.trim() === '' ? [] : searchProducts(activeProducts, query).slice(0, 6)),
    [activeProducts, query],
  );
  const total = useMemo(() => totalOf(lines), [lines]);

  function addProduct(product: Product) {
    setLines((current) => {
      const existing = current.find((l): l is UtangLine & { kind: 'product' } => l.kind === 'product' && l.product.id === product.id);
      if (existing) {
        return current.map((l) => (l.key === existing.key ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...current, { kind: 'product', key: product.id, product, quantity: 1 }];
    });
    setQuery('');
    setError(null);
  }

  function setQuantity(key: string, quantity: number) {
    setLines((current) =>
      quantity <= 0 ? current.filter((l) => l.key !== key) : current.map((l) => (l.key === key ? { ...l, quantity } : l)),
    );
  }

  function removeLine(key: string) {
    setLines((current) => current.filter((l) => l.key !== key));
    setError(null);
  }

  function addCustom() {
    const name = customName.trim();
    const price = parseAmount(customPrice);
    const qty = parseWholeNumber(customQty);
    if (name === '') return setError('Please enter the item name.');
    if (price === null) return setError('Please enter a price.');
    if (qty === null || qty <= 0) return setError('Please enter how many pieces.');
    setLines((current) => [...current, { kind: 'custom', key: `custom-${Date.now()}`, name, price, quantity: qty }]);
    setCustomName('');
    setCustomPrice('');
    setCustomQty('1');
    setAddingCustom(false);
    setError(null);
  }

  async function save() {
    if (lines.length === 0) return setError('Add at least one item.');
    setSaving(true);
    setError(null);
    try {
      const items: UtangItemInput[] = lines.map((l) =>
        l.kind === 'product' ? { product_id: l.product.id, quantity: l.quantity } : { custom_name: l.name, unit_price: l.price, quantity: l.quantity },
      );
      await addUtangItems(customer.id, items, total);
      await reload();
      toast('UTANG ADDED');
      onClose();
    } catch (e) {
      setError(messageOf(e, 'Something went wrong while saving. Nothing was changed.'));
      setSaving(false);
    }
  }

  return (
    <Sheet
      title="Add utang"
      onClose={onClose}
      footer={
        <Button variant="honey" size="lg" full disabled={saving || lines.length === 0} onClick={save}>
          {saving ? 'SAVING…' : lines.length === 0 ? 'CONFIRM UTANG' : `CONFIRM UTANG · ${formatPeso(total)}`}
        </Button>
      }
    >
      <div className="space-y-4">
        <p className="font-display text-2xl font-bold leading-tight">{customer.name}</p>
        <div className="flex items-center justify-between border-2 border-line bg-field px-3 py-3">
          <span className="font-semibold">Current balance</span>
          <Money value={customer.balance} className="text-2xl" />
        </div>

        <label className="block">
          <span className="mb-1 block text-[15px] font-semibold">Add product</span>
          <input
            className={inputClass}
            placeholder="Search product…"
            value={query}
            autoComplete="off"
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {results.length > 0 && (
          <ul className="border-2 border-line bg-field">
            {results.map((product) => (
              <li key={product.id} className="border-b-2 border-line last:border-b-0">
                <button
                  type="button"
                  onClick={() => addProduct(product)}
                  className="flex min-h-14 w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-sand"
                >
                  <span className="font-display text-lg font-semibold leading-tight">{product.name}</span>
                  <Money value={product.selling_price} className="text-xl" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {lines.length > 0 && (
          <ul>
            {lines.map((line) => (
              <li key={line.key} className="border-b-2 border-dashed border-line py-3 first:border-t-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="flex flex-wrap items-center gap-2 pt-1.5">
                    <span className="font-display text-lg font-semibold leading-tight">{nameOf(line)}</span>
                    {line.kind === 'custom' && (
                      <span className="rounded-sm bg-honey-wash px-1.5 py-0.5 text-xs font-bold text-honey-deep">
                        NOT ON LIST
                      </span>
                    )}
                  </p>
                  <button
                    type="button"
                    aria-label={`Remove ${nameOf(line)}`}
                    onClick={() => removeLine(line.key)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded border-2 border-transparent text-ink-soft hover:border-brick hover:bg-brick-wash hover:text-brick"
                  >
                    <TrashIcon />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Stepper
                    label={`Quantity of ${nameOf(line)}`}
                    value={line.quantity}
                    max={line.kind === 'product' ? line.product.stock_quantity : undefined}
                    onChange={(next) => setQuantity(line.key, next)}
                  />
                  <Money value={subtotalOf(line)} className="text-2xl" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {addingCustom ? (
          <div className="space-y-3 border-2 border-line bg-field p-3">
            <p className="font-semibold">Item not on the list</p>
            <TextField label="Item name" value={customName} autoFocus autoComplete="off" onChange={(e) => setCustomName(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <MoneyField label="Price each" value={customPrice} placeholder="0" onChange={(e) => setCustomPrice(e.target.value)} />
              <NumberField
                label="Pieces"
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="honey" onClick={addCustom}>
                Add item
              </Button>
              <Button onClick={() => setAddingCustom(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button size="sm" onClick={() => setAddingCustom(true)}>
            + Item not on the list
          </Button>
        )}

        {lines.length > 0 && (
          <div className="flex items-center justify-between border-2 border-ink bg-honey px-3 py-3">
            <span className="font-display text-lg font-bold">TOTAL</span>
            <Money value={total} className="text-4xl" />
          </div>
        )}

        {error && <Banner tone="error">{error}</Banner>}
      </div>
    </Sheet>
  );
}
