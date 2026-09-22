import { fromCents, toCents } from './money';
import type { Sale } from '../types';

export type TodaySummary = {
  total: number;
  paid: number;
  utang: number;
  itemsSold: number;
  count: number;
};

export function summarizeSales(sales: Sale[]): TodaySummary {
  let total = 0;
  let utang = 0;
  let itemsSold = 0;
  for (const sale of sales) {
    total += toCents(sale.total_amount);
    if (sale.payment_type === 'UTANG') utang += toCents(sale.total_amount);
    itemsSold += sale.sale_items.reduce((sum, item) => sum + item.quantity, 0);
  }
  return {
    total: fromCents(total),
    paid: fromCents(total - utang),
    utang: fromCents(utang),
    itemsSold,
    count: sales.length,
  };
}

/** "3 × Coca-Cola 1.5L, 2 × Sardines +1 more" */
export function describeItems(sale: Sale, show = 2): string {
  const parts = sale.sale_items.slice(0, show).map((i) => `${i.quantity} × ${i.product_name}`);
  const more = sale.sale_items.length - show;
  return more > 0 ? `${parts.join(', ')} +${more} more` : parts.join(', ');
}
