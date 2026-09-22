import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { confirmSale } from '../db/sales';
import { messageOf } from '../lib/errors';
import { parseAmount } from '../lib/money';
import { changeFor, clampQuantity, isShort, itemCount, priceLines, saleTotal, type PricedLine } from '../lib/sale';
import type { PaymentType, SaleLine, SaleReceipt } from '../types';
import { useStore } from './StoreContext';

type SaleValue = {
  lines: PricedLine[];
  total: number;
  itemCount: number;
  /** True when a line asks for more than is in stock. */
  hasStockProblem: boolean;
  quantityOf: (productId: string) => number;
  setQuantity: (productId: string, quantity: number) => void;
  addOne: (productId: string) => void;
  clear: () => void;

  paymentType: PaymentType;
  setPaymentType: (type: PaymentType) => void;
  cashInput: string;
  setCashInput: (text: string) => void;
  cashReceived: number | null;
  change: number | null;
  cashIsShort: boolean;
  customerId: string | null;
  setCustomerId: (id: string | null) => void;

  /** A short message such as "Only 3 Coca-Cola 1.5L are available." */
  notice: string | null;
  saving: boolean;
  saveError: string | null;
  receipt: SaleReceipt | null;
  dismissReceipt: () => void;
  confirm: () => Promise<void>;
};

const SaleContext = createContext<SaleValue | null>(null);
const STORAGE_KEY = 'honey.currentSale';

function loadSavedLines(): SaleLine[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter(
      (l): l is SaleLine => typeof l?.productId === 'string' && Number.isInteger(l?.quantity) && l.quantity > 0,
    );
  } catch {
    return [];
  }
}

/** The sale being rung up right now. Lives above the pages so it survives switching tabs. */
export function SaleProvider({ children }: { children: ReactNode }) {
  const { productsById, customers, reload } = useStore();
  const [rawLines, setRawLines] = useState<SaleLine[]>(loadSavedLines);
  const [paymentType, setPaymentType] = useState<PaymentType>('PAID');
  const [cashInput, setCashInput] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<SaleReceipt | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rawLines));
    } catch {
      // Private browsing can block storage. The sale still works, it just isn't remembered.
    }
  }, [rawLines]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const lines = useMemo(() => priceLines(rawLines, productsById), [rawLines, productsById]);
  const total = useMemo(() => saleTotal(lines), [lines]);

  const cashReceived = parseAmount(cashInput);
  const cashIsShort = paymentType === 'PAID' && cashReceived !== null && isShort(total, cashReceived);
  const change = paymentType === 'PAID' && cashReceived !== null ? changeFor(total, cashReceived) : null;

  const setQuantity = useCallback(
    (productId: string, wanted: number) => {
      const product = productsById.get(productId);
      if (!product) return;
      const quantity = clampQuantity(product, wanted);
      if (quantity < wanted) setNotice(`Only ${product.stock_quantity} ${product.name} are available.`);
      setReceipt(null);
      setSaveError(null);
      setRawLines((current) => {
        const others = current.filter((l) => l.productId !== productId);
        return quantity > 0 ? [...others, { productId, quantity }].sort(byOriginalOrder(current)) : others;
      });
    },
    [productsById],
  );

  const quantityOf = useCallback(
    (productId: string) => rawLines.find((l) => l.productId === productId)?.quantity ?? 0,
    [rawLines],
  );

  const addOne = useCallback(
    (productId: string) => setQuantity(productId, quantityOf(productId) + 1),
    [setQuantity, quantityOf],
  );

  const resetDraft = useCallback(() => {
    setRawLines([]);
    setCashInput('');
    setCustomerId(null);
    setPaymentType('PAID');
    setSaveError(null);
  }, []);

  const confirm = useCallback(async () => {
    if (saving || lines.length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      const customer = customers.find((c) => c.id === customerId) ?? null;
      const result = await confirmSale({
        lines: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        expectedTotal: total,
        paymentType,
        cashReceived: paymentType === 'PAID' ? cashReceived : null,
        customerId: paymentType === 'UTANG' ? customerId : null,
      });
      setReceipt({
        total: result.total,
        paymentType,
        cashReceived: result.cashReceived,
        change: result.change,
        customerName: customer?.name ?? null,
        customerBalance: result.customerBalance,
      });
      resetDraft();
      await reload();
    } catch (error) {
      setSaveError(messageOf(error, 'Something went wrong while saving the sale. No stock was deducted.'));
      await reload();
    } finally {
      setSaving(false);
    }
  }, [saving, lines, customers, customerId, total, paymentType, cashReceived, resetDraft, reload]);

  const value: SaleValue = {
    lines,
    total,
    itemCount: itemCount(lines),
    hasStockProblem: lines.some((l) => l.shortBy !== null),
    quantityOf,
    setQuantity,
    addOne,
    clear: () => {
      resetDraft();
      setReceipt(null);
    },
    paymentType,
    setPaymentType: (type) => {
      setPaymentType(type);
      setSaveError(null);
    },
    cashInput,
    setCashInput,
    cashReceived,
    change,
    cashIsShort,
    customerId,
    setCustomerId,
    notice,
    saving,
    saveError,
    receipt,
    dismissReceipt: () => setReceipt(null),
    confirm,
  };

  return <SaleContext.Provider value={value}>{children}</SaleContext.Provider>;
}

/** Keeps lines in the order they were first added. */
function byOriginalOrder(original: SaleLine[]) {
  const position = new Map(original.map((l, index) => [l.productId, index]));
  return (a: SaleLine, b: SaleLine) => (position.get(a.productId) ?? 1e9) - (position.get(b.productId) ?? 1e9);
}

export function useSale(): SaleValue {
  const value = useContext(SaleContext);
  if (!value) throw new Error('useSale must be used inside SaleProvider');
  return value;
}
