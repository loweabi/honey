import { Shell } from './components/Shell';
import { useRoute } from './hooks/useRoute';
import { isConfigured } from './lib/supabase';
import Counter from './pages/Counter';
import Login from './pages/Login';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Stock from './pages/Stock';
import Utang from './pages/Utang';
import { AuthProvider, useAuth } from './state/AuthContext';
import { SaleProvider } from './state/SaleContext';
import { StoreProvider } from './state/StoreContext';
import { ToastProvider } from './state/ToastContext';

export default function App() {
  if (!isConfigured) return <SetupNeeded />;
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

/** Only signed-in people get past this point. */
function Gate() {
  const { status } = useAuth();
  if (status === 'loading') return <p className="p-8 text-center text-ink-soft">Loading…</p>;
  if (status === 'signedOut') return <Login />;
  return (
    <ToastProvider>
      <StoreProvider>
        <SaleProvider>
          <Shell>
            <CurrentPage />
          </Shell>
        </SaleProvider>
      </StoreProvider>
    </ToastProvider>
  );
}

function CurrentPage() {
  const { page } = useRoute();
  switch (page) {
    case 'products':
      return <Products />;
    case 'sales':
      return <Sales />;
    case 'utang':
      return <Utang />;
    case 'stock':
      return <Stock />;
    default:
      return <Counter />;
  }
}

function SetupNeeded() {
  return (
    <main className="mx-auto max-w-md px-5 py-12">
      <h1 className="font-display text-3xl font-extrabold">Almost ready</h1>
      <p className="mt-2 text-ink-soft">
        This app isn't connected to its database yet. Copy <code>.env.example</code> to <code>.env</code>, fill in your
        Supabase URL and anon key, then restart. The steps are in the README.
      </p>
    </main>
  );
}
