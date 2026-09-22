import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatPeso, parseAmount, parseWholeNumber } from './money';

test('formatPeso', () => {
  assert.equal(formatPeso(75), '₱75.00');
  assert.equal(formatPeso(1250.5), '₱1,250.50');
  assert.equal(formatPeso(-100), '-₱100.00');
});

test('parseAmount accepts what people type', () => {
  assert.equal(parseAmount('75'), 75);
  assert.equal(parseAmount('₱1,200.50'), 1200.5);
  assert.equal(parseAmount(' 12.5 '), 12.5);
  assert.equal(parseAmount('.5'), 0.5);
});

test('parseAmount rejects nonsense', () => {
  assert.equal(parseAmount(''), null);
  assert.equal(parseAmount('.'), null);
  assert.equal(parseAmount('abc'), null);
  assert.equal(parseAmount('12.345'), null);
  assert.equal(parseAmount('-5'), null);
});

test('parseWholeNumber', () => {
  assert.equal(parseWholeNumber('12'), 12);
  assert.equal(parseWholeNumber(' 0 '), 0);
  assert.equal(parseWholeNumber('1.5'), null);
  assert.equal(parseWholeNumber(''), null);
});
