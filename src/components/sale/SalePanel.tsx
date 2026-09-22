import { useState } from 'react';
import { formatPeso } from '../../lib/money';
import { useSale } from '../../state/SaleContext';
import type { Product } from '../../types';
import { AddStockSheet } from '../products/AddStockSheet';
import { Banner } from '../ui/Banner';
import { Button } from '../ui/Button';
import { Money } from '../ui/Money';
import { Stepper } from '../ui/Stepper';
import { CashPayment } from './CashPayment';
import { ReceiptView } from './ReceiptView';
import { UtangPayment } from './UtangPayment';

/** The current sale: items, total, PAID or UTANG, and the confirm button. */
export function SalePanel({ onNextCustomer, showTitle = true }: { onNextCustomer?: () => void; showTitle?: boolean }) {
  const sale = useSale();
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [restocking, setRestocking] = useState<Product | null>(null);

  if (sale.lines.length === 0) {
    if (sale.receipt) {
      return (
        <ReceiptView
          receipt={sale.receipt}
          onNext={() => {
            sale.dismissReceipt();
            onNextCustomer?.();
          }}
        />
      );
    }
    return (
      <div className="border-2 border-dashed border-line px-4 py-10 text-center">
        <p className="font-display text-xl font-bold">No items yet</p>
        <p className="mt-1 text-ink-soft">Search for a product and tap ADD.</p>
      </div>
    );
  }

  const isUtang = sale.paymentType === 'UTANG';
  const cannotConfirm =
    sale.saving || sale.hasStockProblem || (isUtang ? sale.customerId === null : sale.cashIsShort);

  return (
    <div className="space-y-4">
      <div className={`flex items-center ${showTitle ? 'justify-between' : 'justify-end'}`}>
        {showTitle && <h2 className="font-display text-xl font-bold">Current sale</h2>}
        {confirmingClear ? (
          <span className="flex items-center gap-1">
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                sale.clear();
                setConfirmingClear(false);
              }}
            >
              Clear all
            </Button>
            <Button size="sm" onClick={() => setConfirmingClear(false)}>
              Keep
            </Button>
          </span>
        ) : (
          <Button variant="quiet" size="sm" onClick={() => setConfirmingClear(true)}>
            Clear sale
          </Button>
        )}
      </div>

      <ul>
        {sale.lines.map(({ product, quantity, subtotal, shortBy }) => (
          <li key={product.id} className="border-b-2 border-dashed border-line py-3 first:border-t-2">
            <p className="font-display text-lg font-semibold leading-tight">{product.name}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Stepper
                  label={`Quantity of ${product.name}`}
                  value={quantity}
                  max={product.stock_quantity}
                  onChange={(next) => sale.setQuantity(product.id, next)}
                />
              </div>
              <div className="text-right">
                <p className="text-sm tabular-nums text-ink-soft">
                  {quantity} × {formatPeso(product.selling_price)}
                </p>
                <Money value={subtotal} className="text-2xl" />
              </div>
            </div>
            {shortBy && (
              <div className="mt-3 space-y-2 border-2 border-brick bg-brick-wash p-3">
                <p className="text-sm font-bold text-brick">NOT ENOUGH STOCK</p>
                <p className="text-brick">
                  Available: <b>{shortBy.available}</b> · Requested: <b>{shortBy.requested}</b>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => sale.setQuantity(product.id, shortBy.available)}>
                    {shortBy.available > 0 ? `Sell only ${shortBy.available}` : 'Remove'}
                  </Button>
                  <Button size="sm" onClick={() => setRestocking(product)}>
                    + ADD STOCK
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {sale.notice && <Banner tone="info">{sale.notice}</Banner>}

      <div className="flex items-end justify-between border-2 border-ink bg-honey px-3 py-3">
        <span className="font-display text-xl font-bold">TOTAL</span>
        <Money value={sale.total} className="text-[52px]" />
      </div>

      <div className="grid grid-cols-2 border-2 border-ink" role="group" aria-label="How is the customer paying?">
        {(['PAID', 'UTANG'] as const).map((type) => (
          <button
            key={type}
            type="button"
            aria-pressed={sale.paymentType === type}
            onClick={() => sale.setPaymentType(type)}
            className={`h-14 font-display text-lg font-bold ${
              sale.paymentType === type ? 'bg-ink text-paper' : 'bg-field text-ink hover:bg-sand'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {isUtang ? <UtangPayment /> : <CashPayment />}

      {sale.saveError && <Banner tone="error">{sale.saveError}</Banner>}

      <div className="sticky bottom-0 -mx-4 border-t-2 border-line bg-paper px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 lg:static lg:mx-0 lg:border-0 lg:px-0 lg:pb-0 lg:pt-0">
        {!isUtang && sale.cashReceived !== null && (
          <div
            role="status"
            className={`mb-2 flex items-center justify-between border-2 px-3 py-1.5 ${
              sale.cashIsShort ? 'border-brick bg-brick-wash text-brick' : 'border-ink bg-olive-wash text-olive'
            }`}
          >
            <span className="font-display text-lg font-bold">{sale.cashIsShort ? 'NOT ENOUGH CASH' : 'CHANGE'}</span>
            {sale.cashIsShort ? (
              <span className="font-display text-lg font-bold">Short {formatPeso(sale.total - sale.cashReceived)}</span>
            ) : (
              <Money value={sale.change ?? 0} className="text-4xl" />
            )}
          </div>
        )}
        <Button variant="honey" size="lg" full disabled={cannotConfirm} onClick={() => void sale.confirm()}>
          {sale.saving ? 'SAVING…' : isUtang ? `CONFIRM UTANG · ${formatPeso(sale.total)}` : `CONFIRM SALE · ${formatPeso(sale.total)}`}
        </Button>
        {isUtang && sale.customerId === null && (
          <p className="mt-2 text-center text-sm text-ink-soft">Choose who this utang is for.</p>
        )}
      </div>

      {restocking && <AddStockSheet product={restocking} onClose={() => setRestocking(null)} />}
    </div>
  );
}
