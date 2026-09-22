import type { Product } from '../types';
import { fromCents, toCents } from './money';

export type UtangLine =
  | { kind: 'product'; key: string; product: Product; quantity: number }
  | { kind: 'custom'; key: string; name: string; price: number; quantity: number };

export function priceOf(line: UtangLine): number {
  return line.kind === 'product' ? line.product.selling_price : line.price;
}

export function subtotalOf(line: UtangLine): number {
  return fromCents(toCents(priceOf(line)) * line.quantity);
}

export function totalOf(lines: UtangLine[]): number {
  return fromCents(lines.reduce((sum, line) => sum + toCents(subtotalOf(line)), 0));
}

export function nameOf(line: UtangLine): string {
  return line.kind === 'product' ? line.product.name : line.name;
}
