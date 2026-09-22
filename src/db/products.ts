import { throwIfError } from '../lib/errors';
import { supabase } from '../lib/supabase';
import type { ProductInput } from '../lib/validation';
import type { Product } from '../types';

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*').order('name');
  throwIfError(error, 'Could not load the products. Please check your connection.');
  return (data ?? []) as Product[];
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const { data, error } = await supabase.rpc('create_product', {
    p_name: input.name,
    p_price: input.price,
    p_stock: input.stock,
    p_low_stock: input.lowStock,
    p_quick: input.quick,
    p_search_terms: input.searchTerms || null,
  });
  throwIfError(error, 'Something went wrong while saving the product. Please try again.');
  return data as Product;
}

export type ProductChanges = Partial<
  Pick<Product, 'name' | 'search_terms' | 'selling_price' | 'low_stock_threshold' | 'is_quick_access' | 'is_active'>
>;

/** Stock is not editable here. Use addStock or applyStockCounts so the change is recorded. */
export async function updateProduct(id: string, changes: ProductChanges): Promise<void> {
  const { error } = await supabase.from('products').update(changes).eq('id', id);
  throwIfError(error, 'Something went wrong while saving the product. Please try again.');
}

export async function removeDemoData(): Promise<void> {
  const { error } = await supabase.rpc('remove_demo_data');
  throwIfError(error, 'Something went wrong while removing the demo data.');
}
