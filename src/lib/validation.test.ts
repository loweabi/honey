import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateMoneyEntry, validateProduct, type ProductDraft } from './validation';

const draft: ProductDraft = { name: 'Coca-Cola 1.5L', price: '75', stock: '12', lowStock: '', quick: false, searchTerms: '' };

test('a product needs only name, price and stock', () => {
  const result = validateProduct(draft, { needsStock: true });
  assert.deepEqual(result, {
    ok: true,
    value: { name: 'Coca-Cola 1.5L', price: 75, stock: 12, lowStock: 5, quick: false, searchTerms: '' },
  });
});

test('plain-language product errors', () => {
  assert.deepEqual(validateProduct({ ...draft, name: '  ' }, { needsStock: true }), {
    ok: false,
    message: 'Please enter a product name.',
  });
  const noPrice = validateProduct({ ...draft, price: '' }, { needsStock: true });
  assert.equal(noPrice.ok, false);
  const noStock = validateProduct({ ...draft, stock: '' }, { needsStock: true });
  assert.equal(noStock.ok, false);
});

test('editing does not need a stock number', () => {
  assert.equal(validateProduct({ ...draft, stock: '' }, { needsStock: false }).ok, true);
});

test('payments cannot exceed the balance', () => {
  assert.equal(validateMoneyEntry('200', 370).ok, true);
  assert.equal(validateMoneyEntry('400', 370).ok, false);
  assert.equal(validateMoneyEntry('0').ok, false);
  assert.equal(validateMoneyEntry('').ok, false);
});
