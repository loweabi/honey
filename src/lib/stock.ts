import type { Product } from '../types';

export const MAX_QUICK_SELL = 9;

export const COUNT_REASONS = [
  'Physical count',
  'Unrecorded sale',
  'Damaged item',
  'Missing item',
  'Counting error',
  'Other',
] as const;

export const isOutOfStock = (product: Product): boolean => product.stock_quantity === 0;

/** At or below the product's low-stock number (out of stock counts too). */
export const needsRestock = (product: Product): boolean => product.stock_quantity <= product.low_stock_threshold;

export const isLowButAvailable = (product: Product): boolean => needsRestock(product) && !isOutOfStock(product);

export function stockLabel(product: Product): string {
  if (isOutOfStock(product)) return 'Out of stock';
  return isLowButAvailable(product) ? `${product.stock_quantity} left` : `${product.stock_quantity} in stock`;
}
