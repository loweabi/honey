import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type ToastValue = { toast: (message: string) => void };

const ToastContext = createContext<ToastValue | null>(null);

/** A short confirmation such as "PRODUCT ADDED" that disappears by itself. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<{ text: string; id: number } | null>(null);

  const toast = useCallback((text: string) => setMessage({ text, id: Date.now() }), []);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 2600);
    return () => window.clearTimeout(timer);
  }, [message]);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message && (
        <div
          role="status"
          className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[60] flex justify-center px-4"
        >
          <p className="border-2 border-ink bg-olive px-5 py-3 font-display text-lg font-bold text-paper shadow-[4px_4px_0_#262421]">
            {message.text}
          </p>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue['toast'] {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value.toast;
}
