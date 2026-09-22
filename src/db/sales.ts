import { throwIfError } from '../lib/errors';
import { supabase } from '../lib/supabase';
import type { PaymentType, Sale, SaleLine } from '../types';
import { cacheData, enqueueSale, isOffline, readCache } from '../lib/offline';

export type ConfirmSaleInput = {
  lines: SaleLine[];
  expectedTotal: number;
  paymentType: PaymentType;
  cashReceived: number | null;
  customerId: string | null;
};

export type ConfirmSaleResult = {
  total: number;
  cashReceived: number | null;
  change: number | null;
  customerBalance: number | null;
};

type ConfirmSaleRow = {
  total: number;
  cash_received: number | null;
  change: number | null;
  customer_balance: number | null;
};

/** Saves the sale, takes stock out, and (for utang) adds to the customer's balance, all in one step. */
export async function confirmSale(input: ConfirmSaleInput): Promise<ConfirmSaleResult> {
  if (isOffline()) {
    const products = await readCache<import('../types').Product[]>('products');
    if (!products) throw new Error('This phone has not synced the store data yet. Connect once before using offline mode.');
    for (const line of input.lines) {
      const product = products.find((p) => p.id === line.productId);
      if (!product || product.stock_quantity < line.quantity) throw new Error(`Not enough stock for ${product?.name ?? 'this item'}. Connect to refresh stock.`);
    }
    const updatedProducts = products.map((p) => {
      const line = input.lines.find((l) => l.productId === p.id);
      return line ? { ...p, stock_quantity: p.stock_quantity - line.quantity, updated_at: new Date().toISOString() } : p;
    });
    await cacheData('products', updatedProducts);
    await enqueueSale(input);
    const change = input.paymentType === 'PAID' && input.cashReceived !== null
      ? input.cashReceived - input.expectedTotal
      : null;
    return {
      total: input.expectedTotal,
      cashReceived: input.cashReceived,
      change,
      customerBalance: null,
    };
  }

  const { data, error } = await supabase.rpc('confirm_sale', {
    p_items: input.lines.map((l) => ({ product_id: l.productId, quantity: l.quantity })),
    p_payment_type: input.paymentType,
    p_expected_total: input.expectedTotal,
    p_cash_received: input.cashReceived,
    p_customer_id: input.customerId,
  });
  throwIfError(error, 'Something went wrong while saving the sale. No stock was deducted.');
  const row = data as ConfirmSaleRow;
  return {
    total: Number(row.total),
    cashReceived: row.cash_received === null ? null : Number(row.cash_received),
    change: row.change === null ? null : Number(row.change),
    customerBalance: row.customer_balance === null ? null : Number(row.customer_balance),
  };
}

const SALE_COLUMNS = '*, customer:customers(name), sale_items(*)';

function toSales(rows: unknown): Sale[] {
  return ((rows ?? []) as Sale[]).map((sale) => ({
    ...sale,
    total_amount: Number(sale.total_amount),
    sale_items: sale.sale_items.map((item) => ({
      ...item,
      unit_price: Number(item.unit_price),
      subtotal: Number(item.subtotal),
    })),
  }));
}

/** Newest first. `from` and `to` are row positions for paging. */
export async function fetchSales(from: number, to: number): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select(SALE_COLUMNS)
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) {
    const cached = await readCache<Sale[]>(`sales:${from}:${to}`);
    if (cached) return cached;
    throwIfError(error, 'Could not load the sales history.');
  }
  const sales = toSales(data);
  await cacheData(`sales:${from}:${to}`, sales);
  return sales;
}

export async function fetchSalesSince(since: Date): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select(SALE_COLUMNS)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false });
  if (error) {
    const cached = await readCache<Sale[]>('sales:today');
    if (cached) return cached;
    throwIfError(error, 'Could not load today\'s sales.');
  }
  const sales = toSales(data);
  await cacheData('sales:today', sales);
  return sales;
}
