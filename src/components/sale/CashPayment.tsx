import { formatPeso, toCents } from '../../lib/money';
import { useSale } from '../../state/SaleContext';
import { Button } from '../ui/Button';
import { MoneyField } from '../ui/Fields';

const BILLS = [20, 50, 100, 200, 500, 1000];

/** Cash received in, change out. Change is worked out for you. */
export function CashPayment() {
  const sale = useSale();
  const suggestions = BILLS.filter((bill) => toCents(bill) >= toCents(sale.total)).slice(0, 3);

  return (
    <div className="space-y-3">
      <MoneyField
        label="Cash received"
        value={sale.cashInput}
        placeholder="0"
        onChange={(e) => sale.setCashInput(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => sale.setCashInput(String(sale.total))}>
          Exact
        </Button>
        {suggestions.map((bill) => (
          <Button key={bill} size="sm" onClick={() => sale.setCashInput(String(bill))}>
            {formatPeso(bill).replace('.00', '')}
          </Button>
        ))}
      </div>

      {sale.cashReceived === null && (
        <p className="text-sm text-ink-soft">Leave this empty if the customer paid the exact amount.</p>
      )}
    </div>
  );
}
