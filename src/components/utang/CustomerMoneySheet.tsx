import { useState } from 'react';
import { recordCustomerTransaction } from '../../db/customers';
import { messageOf } from '../../lib/errors';
import { parseAmount } from '../../lib/money';
import { validateMoneyEntry } from '../../lib/validation';
import { useStore } from '../../state/StoreContext';
import { useToast } from '../../state/ToastContext';
import type { Customer } from '../../types';
import { Banner } from '../ui/Banner';
import { Button } from '../ui/Button';
import { MoneyField } from '../ui/Fields';
import { Money } from '../ui/Money';
import { Sheet } from '../ui/Sheet';

/** Record a payment toward a customer's balance. */
export function CustomerMoneySheet({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const { reloadCustomers } = useStore();
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const entered = parseAmount(amount) ?? 0;
  const newBalance = Math.max(0, customer.balance - entered);

  async function save() {
    const result = validateMoneyEntry(amount, customer.balance);
    if (!result.ok) return setError(result.message);
    setSaving(true);
    try {
      await recordCustomerTransaction(customer.id, 'PAYMENT', result.value, '');
      await reloadCustomers();
      toast('PAYMENT RECORDED');
      onClose();
    } catch (e) {
      setError(messageOf(e, 'Something went wrong while saving. Nothing was changed.'));
      setSaving(false);
    }
  }

  return (
    <Sheet
      title="Record payment"
      onClose={onClose}
      footer={
        <Button variant="honey" size="lg" full disabled={saving} onClick={save}>
          {saving ? 'SAVING…' : 'CONFIRM PAYMENT'}
        </Button>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <p className="font-display text-2xl font-bold leading-tight">{customer.name}</p>
        <div className="flex items-center justify-between border-2 border-line bg-field px-3 py-3">
          <span className="font-semibold">Current balance</span>
          <Money value={customer.balance} className="text-2xl" />
        </div>
        <MoneyField
          label="Payment amount"
          value={amount}
          autoFocus
          placeholder="0"
          onChange={(e) => {
            setAmount(e.target.value);
            setError(null);
          }}
        />
        {customer.balance > 0 && (
          <Button size="sm" onClick={() => setAmount(String(customer.balance))}>
            Pay full balance
          </Button>
        )}
        <div className="flex items-center justify-between border-2 border-ink bg-honey-wash px-3 py-3">
          <span className="font-display text-lg font-bold">New balance</span>
          <Money value={newBalance} className="text-3xl" />
        </div>
        {error && <Banner tone="error">{error}</Banner>}
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}
