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
import { MoneyField, TextField } from '../ui/Fields';
import { Money } from '../ui/Money';
import { Sheet } from '../ui/Sheet';

type Props = {
  customer: Customer;
  type: 'PAYMENT' | 'UTANG';
  onClose: () => void;
};

/** Record a payment or add utang: amount in, new balance shown before confirming. */
export function CustomerMoneySheet({ customer, type, onClose }: Props) {
  const { reloadCustomers } = useStore();
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isPayment = type === 'PAYMENT';
  const entered = parseAmount(amount) ?? 0;
  const newBalance = customer.balance + (isPayment ? -entered : entered);

  async function save() {
    const result = validateMoneyEntry(amount, isPayment ? customer.balance : undefined);
    if (!result.ok) return setError(result.message);
    setSaving(true);
    try {
      await recordCustomerTransaction(customer.id, type, result.value, notes);
      await reloadCustomers();
      toast(isPayment ? 'PAYMENT RECORDED' : 'UTANG ADDED');
      onClose();
    } catch (e) {
      setError(messageOf(e, 'Something went wrong while saving. Nothing was changed.'));
      setSaving(false);
    }
  }

  return (
    <Sheet
      title={isPayment ? 'Record payment' : 'Add utang'}
      onClose={onClose}
      footer={
        <Button variant="honey" size="lg" full disabled={saving} onClick={save}>
          {saving ? 'SAVING…' : isPayment ? 'CONFIRM PAYMENT' : 'CONFIRM UTANG'}
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
          label={isPayment ? 'Payment amount' : 'Utang amount'}
          value={amount}
          autoFocus
          placeholder="0"
          onChange={(e) => {
            setAmount(e.target.value);
            setError(null);
          }}
        />
        {isPayment && customer.balance > 0 && (
          <Button size="sm" onClick={() => setAmount(String(customer.balance))}>
            Pay full balance
          </Button>
        )}
        {!isPayment && (
          <TextField
            label="What was it for? (optional)"
            value={notes}
            autoComplete="off"
            onChange={(e) => setNotes(e.target.value)}
          />
        )}
        <div className="flex items-center justify-between border-2 border-ink bg-honey-wash px-3 py-3">
          <span className="font-display text-lg font-bold">New balance</span>
          <Money value={Math.max(0, newBalance)} className="text-3xl" />
        </div>
        {error && <Banner tone="error">{error}</Banner>}
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}
