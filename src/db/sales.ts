import { throwIfError } from '../lib/errors';
import { supabase } from '../lib/supabase';
import type { PaymentType, Sale, SaleLine } from '../types';

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
  throwIfError(error, 'Could not load the sales history.');
  return toSales(data);
}

export async function fetchSalesSince(since: Date): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select(SALE_COLUMNS)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false });
  throwIfError(error, 'Could not load today\'s sales.');
  return toSales(data);
}
