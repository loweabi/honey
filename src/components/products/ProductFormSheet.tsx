import { useState } from 'react';
import { createProduct, updateProduct } from '../../db/products';
import { messageOf } from '../../lib/errors';
import { MAX_QUICK_SELL } from '../../lib/stock';
import { validateProduct, type ProductDraft } from '../../lib/validation';
import { useStore } from '../../state/StoreContext';
import { useToast } from '../../state/ToastContext';
import type { Product } from '../../types';
import { Banner } from '../ui/Banner';
import { Button } from '../ui/Button';
import { MoneyField, NumberField, TextField } from '../ui/Fields';
import { Sheet } from '../ui/Sheet';

type Props = {
  /** Leave out to add a new product. */
  product?: Product;
  /** Name to start with when adding (for example, what was just searched). */
  initialName?: string;
  onClose: () => void;
  onAddStock?: () => void;
  onAdjustStock?: () => void;
};

function toDraft(product: Product | undefined, initialName: string): ProductDraft {
  if (!product) return { name: initialName, price: '', stock: '', lowStock: '', quick: false, searchTerms: '' };
  return {
    name: product.name,
    price: String(product.selling_price),
    stock: '',
    lowStock: String(product.low_stock_threshold),
    quick: product.is_quick_access,
    searchTerms: product.search_terms ?? '',
  };
}

export function ProductFormSheet({ product, initialName = '', onClose, onAddStock, onAdjustStock }: Props) {
  const { products, reloadProducts } = useStore();
  const toast = useToast();
  const [draft, setDraft] = useState(() => toDraft(product, initialName));
  const [showMore, setShowMore] = useState(Boolean(product));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmingArchive, setConfirmingArchive] = useState(false);

  const editing = product !== undefined;
  const set = (changes: Partial<ProductDraft>) => {
    setDraft((d) => ({ ...d, ...changes }));
    setError(null);
  };

  async function save() {
    const result = validateProduct(draft, { needsStock: !editing });
    if (!result.ok) return setError(result.message);
    const input = result.value;

    const quickCount = products.filter((p) => p.is_active && p.is_quick_access && p.id !== product?.id).length;
    if (input.quick && quickCount >= MAX_QUICK_SELL) {
      return setError(`Quick sell is full (${MAX_QUICK_SELL} products). Turn one off first.`);
    }

    setSaving(true);
    try {
      if (product) {
        await updateProduct(product.id, {
          name: input.name,
          selling_price: input.price,
          low_stock_threshold: input.lowStock,
          is_quick_access: input.quick,
          search_terms: input.searchTerms || null,
        });
      } else {
        await createProduct(input);
      }
      await reloadProducts();
      toast(editing ? 'CHANGES SAVED' : 'PRODUCT ADDED');
      onClose();
    } catch (e) {
      setError(messageOf(e, 'Something went wrong while saving the product.'));
      setSaving(false);
    }
  }

  async function setArchived(archived: boolean) {
    if (!product) return;
    setSaving(true);
    try {
      await updateProduct(product.id, { is_active: !archived });
      await reloadProducts();
      toast(archived ? 'PRODUCT ARCHIVED' : 'PRODUCT RESTORED');
      onClose();
    } catch (e) {
      setError(messageOf(e, 'Something went wrong while saving the product.'));
      setSaving(false);
      setConfirmingArchive(false);
    }
  }

  return (
    <Sheet
      title={editing ? 'Edit product' : 'Add product'}
      onClose={onClose}
      footer={
        <Button type="submit" form="product-form" variant="honey" size="lg" full disabled={saving}>
          {saving ? 'SAVING…' : editing ? 'SAVE CHANGES' : 'ADD PRODUCT'}
        </Button>
      }
    >
      <form
        id="product-form"
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <TextField
          label="Product name"
          value={draft.name}
          autoFocus={!editing}
          autoComplete="off"
          placeholder="Coca-Cola 1.5L"
          onChange={(e) => set({ name: e.target.value })}
        />
        <MoneyField label="Selling price" value={draft.price} placeholder="75" onChange={(e) => set({ price: e.target.value })} />

        {editing ? (
          <div className="border-2 border-line bg-field p-3">
            <p className="text-[15px] font-semibold">Current stock</p>
            <p className="font-display text-3xl font-extrabold tabular-nums">{product.stock_quantity}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={onAddStock}>
                + ADD STOCK
              </Button>
              <Button size="sm" onClick={onAdjustStock}>
                FIX COUNT
              </Button>
            </div>
          </div>
        ) : (
          <NumberField label="Current stock" value={draft.stock} placeholder="12" onChange={(e) => set({ stock: e.target.value })} />
        )}

        {!editing && !showMore && (
          <Button variant="quiet" size="sm" onClick={() => setShowMore(true)}>
            More options
          </Button>
        )}

        {showMore && (
          <div className="space-y-4 border-t-2 border-line pt-4">
            <NumberField
              label="Low stock number"
              hint="Shows LOW STOCK when the stock is this number or less."
              value={draft.lowStock}
              placeholder="5"
              onChange={(e) => set({ lowStock: e.target.value })}
            />
            <TextField
              label="Other names for searching"
              hint='For example "coke" for Coca-Cola.'
              value={draft.searchTerms}
              autoComplete="off"
              onChange={(e) => set({ searchTerms: e.target.value })}
            />
            <label className="flex min-h-12 items-center gap-3 font-semibold">
              <input
                type="checkbox"
                className="h-6 w-6 accent-ink"
                checked={draft.quick}
                onChange={(e) => set({ quick: e.target.checked })}
              />
              Show in Quick sell on the home screen
            </label>
          </div>
        )}

        {error && <Banner tone="error">{error}</Banner>}

        {editing && (
          <div className="border-t-2 border-line pt-4">
            {!product.is_active ? (
              <Button variant="outline" full disabled={saving} onClick={() => setArchived(false)}>
                Restore product
              </Button>
            ) : confirmingArchive ? (
              <div className="space-y-3">
                <Banner tone="info">
                  Archive {product.name}? It stops showing up in search. Past sales stay in the history.
                </Banner>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="danger" disabled={saving} onClick={() => setArchived(true)}>
                    Yes, archive
                  </Button>
                  <Button onClick={() => setConfirmingArchive(false)}>Keep it</Button>
                </div>
              </div>
            ) : (
              <Button variant="danger" full onClick={() => setConfirmingArchive(true)}>
                Archive product
              </Button>
            )}
          </div>
        )}
      </form>
    </Sheet>
  );
}
