import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Product } from '../types';
import { isLowButAvailable, isOutOfStock, needsRestock, stockLabel } from './stock';

const base: Product = {
  id: '1',
  name: 'Coca-Cola 1.5L',
  search_terms: null,
  selling_price: 75,
  stock_quantity: 8,
  low_stock_threshold: 5,
  is_quick_access: false,
  is_active: true,
  is_demo: false,
  created_at: '',
  updated_at: '',
};

test('stock states', () => {
  assert.equal(stockLabel(base), '8 in stock');
  assert.equal(needsRestock(base), false);

  const low = { ...base, stock_quantity: 3 };
  assert.equal(stockLabel(low), '3 left');
  assert.equal(isLowButAvailable(low), true);

  const out = { ...base, stock_quantity: 0 };
  assert.equal(stockLabel(out), 'Out of stock');
  assert.equal(isOutOfStock(out), true);
  assert.equal(needsRestock(out), true);
  assert.equal(isLowButAvailable(out), false);
});
