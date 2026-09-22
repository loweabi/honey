import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Product } from '../types';
import { subtotalOf, totalOf, type UtangLine } from './utang-items';

const rice: Product = {
  id: 'rice', name: 'Rice (1 kilo)', search_terms: null, selling_price: 58, stock_quantity: 50,
  low_stock_threshold: 10, is_quick_access: true, is_active: true, is_demo: false, created_at: '', updated_at: '',
};

test('mixed catalog and custom lines total correctly', () => {
  const lines: UtangLine[] = [
    { kind: 'product', key: 'rice', product: rice, quantity: 2 },
    { kind: 'custom', key: 'c1', name: 'Ice', price: 5, quantity: 3 },
  ];
  assert.equal(subtotalOf(lines[0]), 116);
  assert.equal(subtotalOf(lines[1]), 15);
  assert.equal(totalOf(lines), 131);
});

test('awkward prices do not drift', () => {
  const lines: UtangLine[] = [{ kind: 'custom', key: 'c1', name: 'Candy', price: 0.5, quantity: 3 }];
  assert.equal(totalOf(lines), 1.5);
});
