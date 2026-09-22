import { useMemo, useState } from 'react';
import { fetchLedger } from '../../db/customers';
import { useLoad } from '../../hooks/useLoad';
import { formatDay } from '../../lib/dates';
import { formatPeso, fromCents, toCents } from '../../lib/money';
import type { Customer, LedgerEntry } from '../../types';
import { Banner } from '../ui/Banner';
import { Button } from '../ui/Button';
import { Money } from '../ui/Money';
import { Tag } from '../ui/Tag';
import { CustomerMoneySheet } from './CustomerMoneySheet';

const typeLabel = { UTANG: 'Utang', PAYMENT: 'Payment', ADJUSTMENT: 'Adjustment' } as const;

export function CustomerCard({ customer }: { customer: Customer }) {
  const [showHistory, setShowHistory] = useState(false);
  const [sheet, setSheet] = useState<'PAYMENT' | 'UTANG' | null>(null);
  const owes = customer.balance > 0;

  return (
    <li className="border-2 border-ink bg-field">
      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-xl font-bold leading-tight">
              {customer.name} {customer.is_demo && <Tag tone="honey">DEMO</Tag>}
            </h3>
            {(customer.phone || customer.notes) && (
              <p className="mt-0.5 text-sm text-ink-soft">{[customer.phone, customer.notes].filter(Boolean).join(' · ')}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-ink-soft">Outstanding</p>
            <Money value={customer.balance} className={`text-4xl ${owes ? 'text-brick' : 'text-olive'}`} />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="honey" className="whitespace-nowrap px-3" disabled={!owes} onClick={() => setSheet('PAYMENT')}>
            ADD PAYMENT
          </Button>
          <Button className="whitespace-nowrap px-3" onClick={() => setSheet('UTANG')}>
            ADD UTANG
          </Button>
        </div>
        <Button variant="quiet" size="sm" className="mt-1" aria-expanded={showHistory} onClick={() => setShowHistory((s) => !s)}>
          {showHistory ? 'Hide history' : 'VIEW HISTORY'}
        </Button>
      </div>

      {showHistory && <History customer={customer} />}
      {sheet && <CustomerMoneySheet customer={customer} type={sheet} onClose={() => setSheet(null)} />}
    </li>
  );
}

function History({ customer }: { customer: Customer }) {
  const ledger = useLoad(() => fetchLedger(customer.id), [customer.id, customer.balance, customer.last_activity]);

  // Running balance after each entry, shown newest first.
  const rows = useMemo(() => {
    let cents = 0;
    return (ledger.data ?? [])
      .map((entry) => {
        cents += toCents(entry.amount);
        return { entry, balance: fromCents(cents) };
      })
      .reverse();
  }, [ledger.data]);

  return (
    <div className="border-t-2 border-ink bg-paper px-3 py-3">
      {ledger.error ? (
        <Banner tone="error">{ledger.error}</Banner>
      ) : ledger.loading && !ledger.data ? (
        <p className="text-ink-soft">Loading history…</p>
      ) : rows.length === 0 ? (
        <p className="text-ink-soft">No transactions yet.</p>
      ) : (
        <ul>
          {rows.map(({ entry, balance }) => (
            <HistoryRow key={entry.id} entry={entry} balance={balance} />
          ))}
        </ul>
      )}
    </div>
  );
}

function HistoryRow({ entry, balance }: { entry: LedgerEntry; balance: number }) {
  const items = entry.sale?.sale_items ?? [];
  const isPayment = entry.amount < 0;
  return (
    <li className="border-b-2 border-dashed border-line py-2.5 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-soft">{formatDay(entry.created_at)}</p>
          <p className="font-display text-lg font-bold leading-tight">{typeLabel[entry.type]}</p>
          {items.length > 0 && (
            <p className="mt-0.5 text-[15px] text-ink-soft">
              {items.map((i) => `${i.quantity} × ${i.product_name}`).join(', ')}
            </p>
          )}
          {entry.notes && entry.notes !== 'Sale' && <p className="mt-0.5 text-[15px] text-ink-soft">{entry.notes}</p>}
        </div>
        <div className="shrink-0 text-right">
          <p className={`font-display text-xl font-extrabold tabular-nums ${isPayment ? 'text-olive' : 'text-brick'}`}>
            {isPayment ? '-' : '+'}
            {formatPeso(Math.abs(entry.amount))}
          </p>
          <p className="text-sm tabular-nums text-ink-soft">Balance {formatPeso(balance)}</p>
        </div>
      </div>
    </li>
  );
}
