import { useMemo, useState } from 'react';
import { fetchSales, fetchSalesSince } from '../db/sales';
import { Banner } from '../components/ui/Banner';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Money } from '../components/ui/Money';
import { Tag } from '../components/ui/Tag';
import { useLoad } from '../hooks/useLoad';
import { dayLabel, formatDayTime, formatTime, startOfToday } from '../lib/dates';
import { formatPeso } from '../lib/money';
import { describeItems, summarizeSales } from '../lib/sales-summary';
import { needsRestock } from '../lib/stock';
import { useStore } from '../state/StoreContext';
import type { Sale } from '../types';

const PAGE_SIZE = 50;

export default function Sales() {
  const { activeProducts, customers } = useStore();
  const today = useLoad(() => fetchSalesSince(startOfToday()), []);
  const recent = useLoad(() => fetchSales(0, PAGE_SIZE - 1), []);
  const [older, setOlder] = useState<Sale[]>([]);
  const [noMore, setNoMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const summary = useMemo(() => summarizeSales(today.data ?? []), [today.data]);
  const outstanding = customers.reduce((sum, c) => sum + Math.max(0, c.balance), 0);
  const utangCustomers = customers.filter((c) => c.balance > 0).length;
  const lowCount = activeProducts.filter(needsRestock).length;

  const sales = useMemo(() => {
    const seen = new Set<string>();
    return [...(recent.data ?? []), ...older].filter((s) => !seen.has(s.id) && seen.add(s.id));
  }, [recent.data, older]);

  const groups = useMemo(() => {
    const result: { label: string; sales: Sale[] }[] = [];
    for (const sale of sales) {
      const label = dayLabel(sale.created_at);
      const last = result[result.length - 1];
      if (last && last.label === label) last.sales.push(sale);
      else result.push({ label, sales: [sale] });
    }
    return result;
  }, [sales]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const rows = await fetchSales(sales.length, sales.length + PAGE_SIZE - 1);
      setOlder((current) => [...current, ...rows]);
      if (rows.length < PAGE_SIZE) setNoMore(true);
    } finally {
      setLoadingMore(false);
    }
  }

  const canLoadMore = !noMore && (recent.data?.length ?? 0) >= PAGE_SIZE;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-3xl font-extrabold">Sales</h1>

      <section aria-label="Today" className="border-2 border-ink bg-field">
        <div className="border-b-2 border-ink bg-honey px-4 py-3">
          <p className="font-display text-lg font-bold">Today's sales</p>
          <Money value={summary.total} className="text-[52px]" />
          {summary.utang > 0 && (
            <p className="mt-1 text-[15px] font-medium">
              {formatPeso(summary.paid)} paid · {formatPeso(summary.utang)} utang
            </p>
          )}
        </div>
        <dl className="grid grid-cols-3 divide-x-2 divide-ink">
          <Stat label="Items sold" value={String(summary.itemsSold)} />
          <Stat label="Outstanding utang" value={formatPeso(outstanding)} note={utangCustomers ? `${utangCustomers} customers` : undefined} href="#/utang" />
          <Stat label="Low stock" value={`${lowCount} ${lowCount === 1 ? 'product' : 'products'}`} href="#/stock/low" />
        </dl>
      </section>

      {(today.error || recent.error) && <Banner tone="error">{today.error ?? recent.error}</Banner>}

      <section aria-label="Sales history">
        <h2 className="mb-2 font-display text-2xl font-bold">History</h2>
        {recent.loading && sales.length === 0 ? (
          <p className="py-6 text-center text-ink-soft">Loading sales…</p>
        ) : sales.length === 0 ? (
          <EmptyState title="NO SALES TODAY">Sales will appear here after transactions are recorded.</EmptyState>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group.label}>
                <h3 className="border-b-2 border-ink pb-1 font-display text-lg font-bold">{group.label}</h3>
                <ul>
                  {group.sales.map((sale) => (
                    <SaleRow key={sale.id} sale={sale} open={openId === sale.id} onToggle={() => setOpenId(openId === sale.id ? null : sale.id)} />
                  ))}
                </ul>
              </div>
            ))}
            {canLoadMore && (
              <Button full disabled={loadingMore} onClick={loadMore}>
                {loadingMore ? 'Loading…' : 'Show older sales'}
              </Button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, note, href }: { label: string; value: string; note?: string; href?: string }) {
  const body = (
    <>
      <dt className="text-sm font-semibold text-ink-soft">{label}</dt>
      <dd className="mt-0.5 font-display text-xl font-extrabold leading-tight tabular-nums">{value}</dd>
      {note && <dd className="text-xs text-ink-soft">{note}</dd>}
    </>
  );
  return href ? (
    <a href={href} className="block px-3 py-3 hover:bg-sand">
      {body}
    </a>
  ) : (
    <div className="px-3 py-3">{body}</div>
  );
}

function SaleRow({ sale, open, onToggle }: { sale: Sale; open: boolean; onToggle: () => void }) {
  return (
    <li className="border-b-2 border-line">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-3 px-1 py-3 text-left hover:bg-sand"
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-ink-soft">{formatTime(sale.created_at)}</span>
          <span className="mt-0.5 block text-base leading-snug">{describeItems(sale)}</span>
          {sale.payment_type === 'UTANG' && sale.customer && (
            <span className="mt-0.5 block text-[15px] font-semibold">{sale.customer.name}</span>
          )}
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1.5">
          <Money value={sale.total_amount} className="text-2xl" />
          <Tag tone={sale.payment_type === 'UTANG' ? 'warn' : 'ok'}>{sale.payment_type}</Tag>
        </span>
      </button>
      {open && (
        <div className="border-t-2 border-dashed border-line bg-field px-3 py-3">
          <p className="mb-2 text-sm text-ink-soft">{formatDayTime(sale.created_at)}</p>
          <ul className="space-y-2">
            {sale.sale_items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3">
                <span>
                  <span className="block font-semibold">{item.product_name}</span>
                  <span className="text-sm tabular-nums text-ink-soft">
                    {item.quantity} × {formatPeso(item.unit_price)}
                  </span>
                </span>
                <span className="font-display font-bold tabular-nums">{formatPeso(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 border-t-2 border-ink pt-2 tabular-nums">
            <Row label="Total" value={formatPeso(sale.total_amount)} strong />
            {sale.payment_type === 'PAID' && sale.cash_received !== null && (
              <>
                <Row label="Cash received" value={formatPeso(sale.cash_received)} />
                <Row label="Change" value={formatPeso(sale.change_amount ?? 0)} />
              </>
            )}
            {sale.payment_type === 'UTANG' && sale.customer && <Row label="Utang to" value={sale.customer.name} />}
          </dl>
        </div>
      )}
    </li>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${strong ? 'font-display text-lg font-bold' : 'text-[15px]'}`}>
      <dt className={strong ? '' : 'text-ink-soft'}>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
