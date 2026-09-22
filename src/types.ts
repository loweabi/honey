export type Product = {
  id: string;
  name: string;
  search_terms: string | null;
  selling_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_quick_access: boolean;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  is_demo: boolean;
  created_at: string;
  balance: number;
  last_activity: string | null;
};

export type PaymentType = 'PAID' | 'UTANG';

export type SaleItem = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

export type Sale = {
  id: string;
  total_amount: number;
  payment_type: PaymentType;
  cash_received: number | null;
  change_amount: number | null;
  customer_id: string | null;
  created_at: string;
  customer: { name: string } | null;
  sale_items: SaleItem[];
};

export type LedgerType = 'UTANG' | 'PAYMENT' | 'ADJUSTMENT';

export type LedgerEntry = {
  id: string;
  customer_id: string;
  type: LedgerType;
  amount: number;
  notes: string | null;
  created_at: string;
  sale: { sale_items: Pick<SaleItem, 'product_name' | 'quantity' | 'unit_price' | 'subtotal'>[] } | null;
};

export type MovementType = 'SALE' | 'RESTOCK' | 'ADJUSTMENT';

export type StockMovement = {
  id: string;
  product_id: string;
  type: MovementType;
  quantity: number;
  stock_after: number;
  reason: string | null;
  created_at: string;
  product: { name: string } | null;
};

export type SaleLine = { productId: string; quantity: number };

export type SaleReceipt = {
  total: number;
  paymentType: PaymentType;
  cashReceived: number | null;
  change: number | null;
  customerName: string | null;
  customerBalance: number | null;
};
