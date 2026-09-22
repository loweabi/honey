import { useState } from 'react';
import { applyStockCounts } from '../../db/stock';
import { messageOf } from '../../lib/errors';
import { parseWholeNumber } from '../../lib/money';
import { COUNT_REASONS } from '../../lib/stock';
import { useStore } from '../../state/StoreContext';
import { useToast } from '../../state/ToastContext';
import type { Product } from '../../types';
import { Banner } from '../ui/Banner';
import { Button } from '../ui/Button';
import { inputClass, NumberField } from '../ui/Fields';
import { Sheet } from '../ui/Sheet';

/** Fix one product's stock after counting the shelf. Saved as an adjustment, not a silent edit. */
export function AdjustStockSheet({ product, onClose }: { product: Product; onClose: () => void }) {
  const { reloadProducts } = useStore();
  const toast = useToast();
  const [actual, setActual] = useState('');
  const [reason, setReason] = useState<string>(COUNT_REASONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const counted = parseWholeNumber(actual);
  const difference = counted === null ? null : counted - product.stock_quantity;

  async function save() {
    if (counted === null) return setError('Please enter the number you counted.');
    if (difference === 0) return setError('That matches the stock in the system. Nothing to adjust.');
    setSaving(true);
    try {
      await applyStockCounts([{ productId: product.id, actual: counted, reason }]);
      await reloadProducts();
      toast('STOCK ADJUSTED');
      onClose();
    } catch (e) {
      setError(messageOf(e, 'Something went wrong while adjusting stock.'));
      setSaving(false);
    }
  }

  return (
    <Sheet
      title="Adjust stock"
      onClose={onClose}
      footer={
        <Button variant="honey" size="lg" full disabled={saving} onClick={save}>
          {saving ? 'SAVING…' : 'ADJUST STOCK'}
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
        <dl className="grid grid-cols-3 gap-2 text-center">
          <div className="border-2 border-line bg-field py-3">
            <dt className="text-sm font-semibold text-ink-soft">Expected</dt>
            <dd className="font-display text-3xl font-extrabold tabular-nums">{product.stock_quantity}</dd>
          </div>
          <div className="border-2 border-line bg-field py-3">
            <dt className="text-sm font-semibold text-ink-soft">Counted</dt>
            <dd className="font-display text-3xl font-extrabold tabular-nums">{counted ?? '–'}</dd>
          </div>
          <div className={`border-2 py-3 ${difference ? 'border-brick bg-brick-wash' : 'border-line bg-field'}`}>
            <dt className="text-sm font-semibold text-ink-soft">Difference</dt>
            <dd className="font-display text-3xl font-extrabold tabular-nums">
              {difference === null ? '–' : difference > 0 ? `+${difference}` : difference}
            </dd>
          </div>
        </dl>
        <NumberField
          label="How many did you count?"
          value={actual}
          autoFocus
          onChange={(e) => {
            setActual(e.target.value.replace(/\D/g, '').slice(0, 5));
            setError(null);
          }}
        />
        <label className="block">
          <span className="mb-1 block text-[15px] font-semibold">Reason</span>
          <select className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)}>
            {COUNT_REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        {error && <Banner tone="error">{error}</Banner>}
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}
