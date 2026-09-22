import type { SaleReceipt } from '../../types';
import { formatPeso } from '../../lib/money';
import { Button } from '../ui/Button';
import { Money } from '../ui/Money';

/** Shown right after a sale is saved, so the change stays on screen while handing it over. */
export function ReceiptView({ receipt, onNext }: { receipt: SaleReceipt; onNext: () => void }) {
  const isUtang = receipt.paymentType === 'UTANG';
  const gaveChange = receipt.change !== null && receipt.change > 0;

  return (
    <div className="space-y-4">
      <div className="border-2 border-ink bg-olive-wash px-4 py-5 text-center">
        <p className="font-display text-xl font-bold text-olive">{isUtang ? 'UTANG SAVED' : 'SALE SAVED'}</p>

        {isUtang ? (
          <>
            <p className="mt-2 text-ink-soft">Added to {receipt.customerName}'s utang</p>
            <p className="mt-3 text-sm font-semibold text-ink-soft">New balance</p>
            <Money value={receipt.customerBalance ?? 0} className="text-5xl text-brick" />
          </>
        ) : gaveChange ? (
          <>
            <p className="mt-3 text-sm font-semibold text-ink-soft">Give change</p>
            <Money value={receipt.change ?? 0} className="text-6xl text-olive" />
          </>
        ) : (
          <p className="mt-3 font-display text-2xl font-bold">No change</p>
        )}

        <p className="mt-4 border-t-2 border-dashed border-line pt-3 text-ink-soft">
          Total {formatPeso(receipt.total)}
          {receipt.cashReceived !== null && <> · Cash {formatPeso(receipt.cashReceived)}</>}
        </p>
      </div>
      <Button variant="ink" size="lg" full onClick={onNext}>
        NEXT CUSTOMER
      </Button>
    </div>
  );
}
