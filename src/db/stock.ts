import { throwIfError } from '../lib/errors';
import { supabase } from '../lib/supabase';
import type { StockMovement } from '../types';

export async function addStock(productId: string, quantity: number): Promise<void> {
  const { error } = await supabase.rpc('add_stock', { p_product_id: productId, p_quantity: quantity });
  throwIfError(error, 'Something went wrong while adding stock. Nothing was changed.');
}

export type StockCount = { productId: string; actual: number; reason: string };

/** Saves a whole physical count at once. Returns how many products changed. */
export async function applyStockCounts(counts: StockCount[]): Promise<number> {
  const { data, error } = await supabase.rpc('apply_stock_counts', {
    p_counts: counts.map((c) => ({ product_id: c.productId, actual: c.actual, reason: c.reason })),
  });
  throwIfError(error, 'Something went wrong while adjusting stock. Nothing was changed.');
  return Number(data ?? 0);
}

export async function fetchMovements(limit = 100): Promise<StockMovement[]> {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*, product:products(name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  throwIfError(error, 'Could not load the stock history.');
  return (data ?? []) as StockMovement[];
}
