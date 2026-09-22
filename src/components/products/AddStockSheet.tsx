import { useState } from 'react';
import { addStock } from '../../db/stock';
import { messageOf } from '../../lib/errors';
import { parseWholeNumber } from '../../lib/money';
import { validateQuantityToAdd } from '../../lib/validation';
import { useStore } from '../../state/StoreContext';
import { useToast } from '../../state/ToastContext';
import type { Product } from '../../types';
import { Banner } from '../ui/Banner';
import { Button } from '../ui/Button';
import { NumberField } from '../ui/Fields';
import { Sheet } from '../ui/Sheet';

export function AddStockSheet({ product, onClose }: { product: Product; onClose: () => void }) {
  const { reloadProducts } = useStore();
  const toast = useToast();
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const adding = parseWholeNumber(quantity) ?? 0;

  async function save() {
    const result = validateQuantityToAdd(quantity);
    if (!result.ok) return setError(result.message);
    setSaving(true);
    try {
      await addStock(product.id, result.value);
      await reloadProducts();
      toast('STOCK ADDED');
      onClose();
    } catch (e) {
      setError(messageOf(e, 'Something went wrong while adding stock.'));
      setSaving(false);
    }
  }

  return (
    <Sheet
      title="Add stock"
      onClose={onClose}
      footer={
        <Button variant="honey" size="lg" full disabled={saving} onClick={save}>
          {saving ? 'SAVING…' : '+ ADD STOCK'}
        </Button>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <p className="font-display text-2xl font-bold leading-tight">{product.name}</p>
        <dl className="grid grid-cols-2 gap-3 text-center">
          <div className="border-2 border-line bg-field py-3">
            <dt className="text-sm font-semibold text-ink-soft">Current stock</dt>
            <dd className="font-display text-3xl font-extrabold tabular-nums">{product.stock_quantity}</dd>
          </div>
          <div className="border-2 border-ink bg-olive-wash py-3">
            <dt className="text-sm font-semibold text-ink-soft">New stock</dt>
            <dd className="font-display text-3xl font-extrabold tabular-nums text-olive">
              {product.stock_quantity + adding}
            </dd>
          </div>
        </dl>
        <NumberField
          label="How many to add?"
          value={quantity}
          autoFocus
          onChange={(e) => {
            setQuantity(e.target.value.replace(/\D/g, '').slice(0, 5));
            setError(null);
          }}
        />
        {error && <Banner tone="error">{error}</Banner>}
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}
