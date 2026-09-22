/** All money math is done in whole centavos so totals never drift (0.1 + 0.2 problems). */
export const toCents = (amount: number): number => Math.round(amount * 100);
export const fromCents = (cents: number): number => cents / 100;

const pesoFormat = new Intl.NumberFormat('en-PH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 1250 -> "1,250.00" */
export function formatAmount(amount: number): string {
  return pesoFormat.format(amount);
}

/** 1250 -> "₱1,250.00" (negative amounts become "-₱100.00") */
export function formatPeso(amount: number): string {
  const text = `₱${formatAmount(Math.abs(amount))}`;
  return amount < 0 ? `-${text}` : text;
}

/** Turns what someone typed ("1,200.50", "₱75") into a number, or null if it isn't one. */
export function parseAmount(text: string): number | null {
  const cleaned = text.replace(/[₱,\s]/g, '');
  if (cleaned === '' || !/^\d*\.?\d{0,2}$/.test(cleaned) || cleaned === '.') return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

/** Turns what someone typed into a whole number (stock, quantity), or null. */
export function parseWholeNumber(text: string): number | null {
  const cleaned = text.trim();
  if (!/^\d+$/.test(cleaned)) return null;
  return Number(cleaned);
}
