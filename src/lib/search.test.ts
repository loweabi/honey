import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Product } from '../types';
import { matchesName, searchProducts } from './search';

function product(name: string, searchTerms: string | null = null): Product {
  return {
    id: name,
    name,
    search_terms: searchTerms,
    selling_price: 10,
    stock_quantity: 5,
    low_stock_threshold: 5,
    is_quick_access: false,
    is_active: true,
    is_demo: false,
    created_at: '',
    updated_at: '',
  };
}

const catalog = [
  product('Coca-Cola Can', 'coke softdrink'),
  product('Coca-Cola 1L', 'coke softdrink'),
  product('Coca-Cola 1.5L', 'coke softdrink'),
  product('Pepsi 1.5L', 'softdrink'),
  product('Lucky Me Pancit Canton', 'pancit noodles'),
  product('Sardines', 'canned'),
  product('Coffee', 'kape'),
  product('Laundry Soap', 'sabon'),
];

const names = (query: string) => searchProducts(catalog, query).map((p) => p.name);

test('"coke" finds Coca-Cola through its nickname, in a sensible order', () => {
  assert.deepEqual(names('coke'), ['Coca-Cola 1.5L', 'Coca-Cola 1L', 'Coca-Cola Can']);
});

test('partial words match', () => {
  assert.deepEqual(names('coca'), ['Coca-Cola 1.5L', 'Coca-Cola 1L', 'Coca-Cola Can']);
  assert.deepEqual(names('sard'), ['Sardines']);
  assert.deepEqual(names('soap'), ['Laundry Soap']);
});

test('several words match in any order', () => {
  assert.deepEqual(names('lucky me'), ['Lucky Me Pancit Canton']);
  assert.deepEqual(names('canton lucky'), ['Lucky Me Pancit Canton']);
});

test('hyphens and case are ignored', () => {
  assert.deepEqual(names('COCA COLA 1.5'), ['Coca-Cola 1.5L']);
});

test('name matches rank above nickname matches', () => {
  assert.equal(names('coffee')[0], 'Coffee');
  assert.equal(names('kape')[0], 'Coffee');
});

test('empty and unknown queries', () => {
  assert.deepEqual(names(''), []);
  assert.deepEqual(names('   '), []);
  assert.deepEqual(names('zzz'), []);
});

test('customer name matching', () => {
  assert.equal(matchesName('Juan Dela Cruz', 'dela'), true);
  assert.equal(matchesName('Juan Dela Cruz', 'cruz juan'), true);
  assert.equal(matchesName('Juan Dela Cruz', 'maria'), false);
  assert.equal(matchesName('Juan Dela Cruz', ''), true);
});
