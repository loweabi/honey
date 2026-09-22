import type { Product, SaleLine } from '../types';
import { fromCents, toCents } from './money';

export type PricedLine = {
  product: Product;
  quantity: number;
  subtotal: number;
  /** Set when the sale asks for more than is in stock. */
  shortBy: { available: number; requested: number } | null;
};

export function priceLines(lines: SaleLine[], products: Map<string, Product>): PricedLine[] {
  const priced: PricedLine[] = [];
  for (const line of lines) {
    const product = products.get(line.productId);
    if (!product || !product.is_active) continue;
    priced.push({
      product,
      quantity: line.quantity,
      subtotal: fromCents(toCents(product.selling_price) * line.quantity),
      shortBy:
        line.quantity > product.stock_quantity
          ? { available: product.stock_quantity, requested: line.quantity }
          : null,
    });
  }
  return priced;
}

export function saleTotal(lines: PricedLine[]): number {
  return fromCents(lines.reduce((sum, line) => sum + toCents(line.subtotal), 0));
}

export function itemCount(lines: PricedLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

/** Cash minus total, never below zero. */
export function changeFor(total: number, cashReceived: number): number {
  return fromCents(Math.max(0, toCents(cashReceived) - toCents(total)));
}

export function isShort(total: number, cashReceived: number): boolean {
  return toCents(cashReceived) < toCents(total);
}

/** The most that can be sold: never more than what is in stock. */
export function clampQuantity(product: Product, wanted: number): number {
  return Math.max(0, Math.min(wanted, product.stock_quantity));
}
