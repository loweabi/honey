import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Product } from '../types';
import { changeFor, clampQuantity, isShort, itemCount, priceLines, saleTotal } from './sale';

function product(id: string, name: string, price: number, stock: number): Product {
  return {
    id,
    name,
    search_terms: null,
    selling_price: price,
    stock_quantity: stock,
    low_stock_threshold: 5,
    is_quick_access: false,
    is_active: true,
    is_demo: false,
    created_at: '',
    updated_at: '',
  };
}

const coke = product('coke', 'Coca-Cola 1.5L', 75, 8);
const lucky = product('lucky', 'Lucky Me Pancit Canton', 15, 20);
const catalog = new Map([coke, lucky].map((p) => [p.id, p]));

test('the counter journey: 2 Coke + 3 Lucky Me = ₱195, change from ₱500 is ₱305', () => {
  const lines = priceLines(
    [
      { productId: 'coke', quantity: 2 },
      { productId: 'lucky', quantity: 3 },
    ],
    catalog,
  );
  assert.deepEqual(lines.map((l) => l.subtotal), [150, 45]);
  assert.equal(saleTotal(lines), 195);
  assert.equal(itemCount(lines), 5);
  assert.equal(changeFor(195, 500), 305);
});

test('totals do not drift on awkward prices', () => {
  const cheap = product('c', 'Candy', 0.1, 100);
  const lines = priceLines([{ productId: 'c', quantity: 3 }], new Map([[cheap.id, cheap]]));
  assert.equal(saleTotal(lines), 0.3);
  assert.equal(changeFor(0.3, 1), 0.7);
});

test('asking for more than is in stock is flagged', () => {
  const [line] = priceLines([{ productId: 'coke', quantity: 10 }], catalog);
  assert.deepEqual(line.shortBy, { available: 8, requested: 10 });
  assert.equal(priceLines([{ productId: 'coke', quantity: 8 }], catalog)[0].shortBy, null);
});

test('lines for archived or missing products are dropped', () => {
  const archived = { ...lucky, is_active: false };
  const lines = priceLines(
    [
      { productId: 'lucky', quantity: 1 },
      { productId: 'gone', quantity: 1 },
    ],
    new Map([[archived.id, archived]]),
  );
  assert.equal(lines.length, 0);
});

test('cash checks', () => {
  assert.equal(isShort(195, 100), true);
  assert.equal(isShort(195, 195), false);
  assert.equal(changeFor(195, 100), 0);
});

test('quantity is capped at stock', () => {
  assert.equal(clampQuantity(coke, 3), 3);
  assert.equal(clampQuantity(coke, 99), 8);
  assert.equal(clampQuantity(coke, -1), 0);
});
