import { throwIfError } from '../lib/errors';
import { supabase } from '../lib/supabase';
import type { Customer, LedgerEntry } from '../types';

export async function fetchCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase.from('customer_balances').select('*').order('name');
  throwIfError(error, 'Could not load the customers. Please check your connection.');
  return ((data ?? []) as Customer[]).map((c) => ({ ...c, balance: Number(c.balance) }));
}

export async function createCustomer(input: { name: string; phone: string; notes: string }): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert({ name: input.name, phone: input.phone.trim() || null, notes: input.notes.trim() || null })
    .select()
    .single();
  throwIfError(error, 'Something went wrong while saving the customer. Please try again.');
  return { ...(data as Omit<Customer, 'balance' | 'last_activity'>), balance: 0, last_activity: null };
}

export async function fetchLedger(customerId: string): Promise<LedgerEntry[]> {
  const { data, error } = await supabase
    .from('customer_transactions')
    .select('*, sale:sales!reference_sale_id(sale_items(product_name, quantity, unit_price, subtotal))')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: true });
  throwIfError(error, 'Could not load the history.');
  return ((data ?? []) as LedgerEntry[]).map((entry) => ({ ...entry, amount: Number(entry.amount) }));
}

/** Adds utang (without a sale) or records a payment. Amount is always positive. Returns the new balance. */
export async function recordCustomerTransaction(
  customerId: string,
  type: 'UTANG' | 'PAYMENT',
  amount: number,
  notes: string,
): Promise<number> {
  const { data, error } = await supabase.rpc('record_customer_transaction', {
    p_customer_id: customerId,
    p_type: type,
    p_amount: amount,
    p_notes: notes.trim() || null,
  });
  throwIfError(error, 'Something went wrong while saving. Nothing was changed.');
  return Number(data);
}

export type UtangItemInput =
  | { product_id: string; quantity: number }
  | { custom_name: string; unit_price: number; quantity: number };

/** Adds itemized utang (real products and/or hand-typed items). Returns the new balance. */
export async function addUtangItems(
  customerId: string,
  items: UtangItemInput[],
  expectedTotal: number,
): Promise<number> {
  const { data, error } = await supabase.rpc('add_utang_items', {
    p_customer_id: customerId,
    p_items: items,
    p_expected_total: expectedTotal,
  });
  throwIfError(error, 'Something went wrong while saving the utang. Nothing was changed.');
  return Number((data as { customer_balance: number }).customer_balance);
}
