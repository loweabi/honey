import { useMemo, useState } from 'react';
import { CustomerCard } from '../components/utang/CustomerCard';
import { CustomerFormSheet } from '../components/utang/CustomerFormSheet';
import { Banner } from '../components/ui/Banner';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Money } from '../components/ui/Money';
import { matchesName } from '../lib/search';
import { useStore } from '../state/StoreContext';

export default function Utang() {
  const { customers, loaded, loadError } = useStore();
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);

  const outstanding = customers.reduce((sum, c) => sum + Math.max(0, c.balance), 0);
  const owing = customers.filter((c) => c.balance > 0).length;

  const visible = useMemo(
    () =>
      customers
        .filter((c) => matchesName(c.name, query))
        .sort((a, b) => b.balance - a.balance || a.name.localeCompare(b.name)),
    [customers, query],
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold">Utang</h1>
        <Button variant="honey" onClick={() => setAdding(true)}>
          + ADD CUSTOMER
        </Button>
      </div>

      <div className="flex items-end justify-between border-2 border-ink bg-honey px-4 py-3">
        <div>
          <p className="font-display text-base font-bold">Outstanding utang</p>
          <p className="text-[15px] font-medium">
            {owing} {owing === 1 ? 'customer owes' : 'customers owe'}
          </p>
        </div>
        <Money value={outstanding} className="text-[40px]" />
      </div>

      <input
        type="search"
        aria-label="Search customers"
        placeholder="Search customer…"
        value={query}
        autoComplete="off"
        onChange={(e) => setQuery(e.target.value)}
        className="h-14 w-full rounded border-2 border-ink bg-field px-4 text-lg placeholder:text-ink-soft/60 focus:border-honey-deep"
      />

      {loadError && <Banner tone="error">{loadError}</Banner>}

      {!loaded ? (
        <p className="py-6 text-center text-ink-soft">Loading customers…</p>
      ) : customers.length === 0 ? (
        <EmptyState
          title="NO CUSTOMERS YET"
          action={
            <Button variant="honey" onClick={() => setAdding(true)}>
              + ADD CUSTOMER
            </Button>
          }
        >
          Customers with utang will appear here.
        </EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState
          title="NO CUSTOMER FOUND"
          action={
            <Button variant="honey" onClick={() => setAdding(true)}>
              + ADD CUSTOMER
            </Button>
          }
        >
          Nobody matches “{query.trim()}”.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {visible.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </ul>
      )}

      {adding && <CustomerFormSheet initialName={query.trim()} onClose={() => setAdding(false)} />}
    </div>
  );
}
