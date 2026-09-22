import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Sale } from '../types';
import { describeItems, summarizeSales } from './sales-summary';

function sale(total: number, type: 'PAID' | 'UTANG', items: [string, number][]): Sale {
  return {
    id: String(Math.random()),
    total_amount: total,
    payment_type: type,
    cash_received: null,
    change_amount: null,
    customer_id: null,
    created_at: '',
    customer: null,
    sale_items: items.map(([name, qty], i) => ({
      id: String(i),
      product_id: name,
      product_name: name,
      quantity: qty,
      unit_price: total / qty,
      subtotal: total,
    })),
  };
}

test('today summary splits paid and utang', () => {
  const summary = summarizeSales([
    sale(195, 'PAID', [['Coke', 2], ['Lucky Me', 3]]),
    sale(150, 'UTANG', [['Coke', 2]]),
  ]);
  assert.deepEqual(summary, { total: 345, paid: 195, utang: 150, itemsSold: 7, count: 2 });
});

test('item description trims long sales', () => {
  const s = sale(10, 'PAID', [['A', 1], ['B', 2], ['C', 3]]);
  assert.equal(describeItems(s), '1 × A, 2 × B +1 more');
});
