import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { fetchCustomers } from '../db/customers';
import { fetchProducts } from '../db/products';
import { messageOf } from '../lib/errors';
import { supabase } from '../lib/supabase';
import type { Customer, Product } from '../types';

type StoreValue = {
  /** Every product, including archived ones. */
  products: Product[];
  /** Only products that can be sold. */
  activeProducts: Product[];
  productsById: Map<string, Product>;
  customers: Customer[];
  loaded: boolean;
  loadError: string | null;
  reload: () => Promise<void>;
  reloadProducts: () => Promise<void>;
  reloadCustomers: () => Promise<void>;
};

const StoreContext = createContext<StoreValue | null>(null);

/**
 * Holds every product and customer in memory so search is instant.
 * A small family store has hundreds of products, not millions.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reloadProducts = useCallback(async () => {
    try {
      setProducts(await fetchProducts());
      setLoadError(null);
    } catch (error) {
      setLoadError(messageOf(error, 'Could not load the products.'));
    }
  }, []);

  const reloadCustomers = useCallback(async () => {
    try {
      setCustomers(await fetchCustomers());
    } catch (error) {
      setLoadError(messageOf(error, 'Could not load the customers.'));
    }
  }, []);

  const reload = useCallback(async () => {
    await Promise.all([reloadProducts(), reloadCustomers()]);
  }, [reloadProducts, reloadCustomers]);

  useEffect(() => {
    reload().then(() => setLoaded(true));
  }, [reload]);

  // Keep every phone up to date: refresh when another phone changes stock or utang,
  // and whenever this app comes back to the front.
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    const refreshSoon = (what: 'products' | 'customers') => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        if (what === 'products') void reloadProducts();
        else void reloadCustomers();
      }, 300);
    };

    const channel = supabase
      .channel('store-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => refreshSoon('products'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_transactions' }, () =>
        refreshSoon('customers'),
      )
      .subscribe();

    const onVisible = () => {
      if (document.visibilityState === 'visible') void reload();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearTimeout(timer.current);
      document.removeEventListener('visibilitychange', onVisible);
      void supabase.removeChannel(channel);
    };
  }, [reload, reloadProducts, reloadCustomers]);

  const value = useMemo<StoreValue>(() => {
    const activeProducts = products.filter((p) => p.is_active);
    return {
      products,
      activeProducts,
      productsById: new Map(products.map((p) => [p.id, p])),
      customers,
      loaded,
      loadError,
      reload,
      reloadProducts,
      reloadCustomers,
    };
  }, [products, customers, loaded, loadError, reload, reloadProducts, reloadCustomers]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore must be used inside StoreProvider');
  return value;
}
