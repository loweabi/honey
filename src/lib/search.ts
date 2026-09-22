import type { Product } from '../types';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.]+/g, ' ')
    .replace(/(^|\s)\.+|\.+(\s|$)/g, ' ')
    .trim();
}

function words(text: string): string[] {
  return text === '' ? [] : text.split(' ');
}

/**
 * Score one product for a query. Returns null when it does not match.
 * Lower is better: name starts with the query < every word starts a name word
 * < matches a nickname < matches inside a word.
 */
function score(product: Product, query: string, tokens: string[]): number | null {
  const name = normalize(product.name);
  const nameWords = words(name);
  const extra = normalize(product.search_terms ?? '');
  const extraWords = words(extra);

  if (name.startsWith(query)) return 0;

  let worst = 0;
  for (const token of tokens) {
    let best: number | null = null;
    if (nameWords.some((w) => w.startsWith(token))) best = 1;
    else if (extraWords.some((w) => w.startsWith(token))) best = 2;
    else if (name.includes(token) || extra.includes(token)) best = 3;
    if (best === null) return null;
    worst = Math.max(worst, best);
  }
  return worst;
}

/** Partial, any-order matching on product name and nicknames. Empty query returns []. */
export function searchProducts(products: Product[], rawQuery: string): Product[] {
  const query = normalize(rawQuery);
  if (query === '') return [];
  const tokens = words(query);

  return products
    .map((product) => ({ product, rank: score(product, query, tokens) }))
    .filter((entry): entry is { product: Product; rank: number } => entry.rank !== null)
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        a.product.name.localeCompare(b.product.name, undefined, { numeric: true, sensitivity: 'base' }),
    )
    .map((entry) => entry.product);
}

/** Same matching for plain names (used to find customers). */
export function matchesName(name: string, rawQuery: string): boolean {
  const query = normalize(rawQuery);
  if (query === '') return true;
  const haystack = normalize(name);
  return words(query).every((token) => haystack.includes(token));
}
