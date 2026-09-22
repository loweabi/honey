import { useMemo, useState } from 'react';
import { matchesName } from '../../lib/search';
import { useSale } from '../../state/SaleContext';
import { useStore } from '../../state/StoreContext';
import { Button } from '../ui/Button';
import { inputClass } from '../ui/Fields';
import { Money } from '../ui/Money';
import { CustomerFormSheet } from '../utang/CustomerFormSheet';

/** "Utang to: Juan Dela Cruz. Balance 250, plus this sale 120, becomes 370." */
export function UtangPayment() {
  const { customers } = useStore();
  const sale = useSale();
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);

  const selected = customers.find((c) => c.id === sale.customerId) ?? null;
  const matches = useMemo(
    () =>
      customers
        .filter((c) => matchesName(c.name, query))
        .sort((a, b) => b.balance - a.balance || a.name.localeCompare(b.name))
        .slice(0, 5),
    [customers, query],
  );

  if (selected) {
    return (
      <div className="border-2 border-ink bg-field p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-ink-soft">Utang to</p>
            <p className="font-display text-2xl font-bold leading-tight">{selected.name}</p>
          </div>
          <Button variant="quiet" size="sm" onClick={() => sale.setCustomerId(null)}>
            Change
          </Button>
        </div>
        <dl className="mt-3 space-y-1.5 border-t-2 border-dashed border-line pt-3">
          <div className="flex items-center justify-between">
            <dt className="text-ink-soft">Current balance</dt>
            <dd>
              <Money value={selected.balance} className="text-xl" />
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-ink-soft">This sale</dt>
            <dd>
              <Money value={sale.total} className="text-xl" />
            </dd>
          </div>
          <div className="flex items-center justify-between border-t-2 border-ink pt-2">
            <dt className="font-bold">New balance</dt>
            <dd>
              <Money value={selected.balance + sale.total} className="text-3xl text-brick" />
            </dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <div>
      <label className="block">
        <span className="mb-1 block text-[15px] font-semibold">Utang to</span>
        <input
          className={inputClass}
          placeholder="Search customer…"
          value={query}
          autoComplete="off"
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <ul className="mt-2 border-2 border-line bg-field">
        {matches.map((customer) => (
          <li key={customer.id} className="border-b-2 border-line last:border-b-0">
            <button
              type="button"
              onClick={() => sale.setCustomerId(customer.id)}
              className="flex min-h-14 w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-sand"
            >
              <span className="font-display text-lg font-semibold leading-tight">{customer.name}</span>
              <span className="text-right">
                <span className="block text-xs font-semibold text-ink-soft">Balance</span>
                <Money value={customer.balance} className="text-lg" />
              </span>
            </button>
          </li>
        ))}
        {matches.length === 0 && (
          <li className="px-3 py-3 text-ink-soft">
            {customers.length === 0 ? 'No customers yet.' : 'No customer with that name.'}
          </li>
        )}
      </ul>
      <Button className="mt-2" size="sm" onClick={() => setAdding(true)}>
        + ADD CUSTOMER
      </Button>
      {adding && (
        <CustomerFormSheet
          initialName={query}
          onClose={() => setAdding(false)}
          onSaved={(customer) => sale.setCustomerId(customer.id)}
        />
      )}
    </div>
  );
}
