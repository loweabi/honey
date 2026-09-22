import { parseAmount, parseWholeNumber } from './money';

export type Result<T> = { ok: true; value: T } | { ok: false; message: string };

export type ProductInput = {
  name: string;
  price: number;
  stock: number;
  lowStock: number;
  quick: boolean;
  searchTerms: string;
};

export type ProductDraft = {
  name: string;
  price: string;
  stock: string;
  lowStock: string;
  quick: boolean;
  searchTerms: string;
};

export function validateProduct(draft: ProductDraft, options: { needsStock: boolean }): Result<ProductInput> {
  const name = draft.name.trim();
  if (name === '') return { ok: false, message: 'Please enter a product name.' };

  const price = parseAmount(draft.price);
  if (price === null) return { ok: false, message: 'Please enter a selling price, like 75 or 12.50.' };

  let stock = 0;
  if (options.needsStock) {
    const parsed = parseWholeNumber(draft.stock);
    if (parsed === null) return { ok: false, message: 'Please enter the current stock as a whole number.' };
    stock = parsed;
  }

  let lowStock = 5;
  if (draft.lowStock.trim() !== '') {
    const parsed = parseWholeNumber(draft.lowStock);
    if (parsed === null) return { ok: false, message: 'Low stock number must be a whole number.' };
    lowStock = parsed;
  }

  return {
    ok: true,
    value: { name, price, stock, lowStock, quick: draft.quick, searchTerms: draft.searchTerms.trim() },
  };
}

export function validateCustomerName(name: string): Result<string> {
  const trimmed = name.trim();
  if (trimmed === '') return { ok: false, message: 'Please enter the customer name.' };
  return { ok: true, value: trimmed };
}

/** For utang and payments. maxAmount is the balance when recording a payment. */
export function validateMoneyEntry(text: string, maxAmount?: number): Result<number> {
  const amount = parseAmount(text);
  if (amount === null || amount <= 0) return { ok: false, message: 'Please enter an amount more than ₱0.' };
  if (maxAmount !== undefined && amount > maxAmount) {
    return { ok: false, message: `The balance is only ₱${maxAmount.toFixed(2)}. Please enter that amount or less.` };
  }
  return { ok: true, value: amount };
}

export function validateQuantityToAdd(text: string): Result<number> {
  const quantity = parseWholeNumber(text);
  if (quantity === null || quantity <= 0) return { ok: false, message: 'Please enter how many to add.' };
  return { ok: true, value: quantity };
}
