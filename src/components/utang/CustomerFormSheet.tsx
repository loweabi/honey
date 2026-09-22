import { useState } from 'react';
import { createCustomer } from '../../db/customers';
import { messageOf } from '../../lib/errors';
import { validateCustomerName } from '../../lib/validation';
import { useStore } from '../../state/StoreContext';
import { useToast } from '../../state/ToastContext';
import type { Customer } from '../../types';
import { Banner } from '../ui/Banner';
import { Button } from '../ui/Button';
import { TextField } from '../ui/Fields';
import { Sheet } from '../ui/Sheet';

type Props = {
  initialName?: string;
  onClose: () => void;
  onSaved?: (customer: Customer) => void;
};

export function CustomerFormSheet({ initialName = '', onClose, onSaved }: Props) {
  const { reloadCustomers } = useStore();
  const toast = useToast();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    const result = validateCustomerName(name);
    if (!result.ok) return setError(result.message);
    setSaving(true);
    try {
      const customer = await createCustomer({ name: result.value, phone, notes });
      await reloadCustomers();
      toast('CUSTOMER ADDED');
      onSaved?.(customer);
      onClose();
    } catch (e) {
      setError(messageOf(e, 'Something went wrong while saving the customer.'));
      setSaving(false);
    }
  }

  return (
    <Sheet
      title="Add customer"
      onClose={onClose}
      footer={
        <Button type="submit" form="customer-form" variant="honey" size="lg" full disabled={saving}>
          {saving ? 'SAVING…' : 'ADD CUSTOMER'}
        </Button>
      }
    >
      <form
        id="customer-form"
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <TextField
          label="Name"
          value={name}
          autoFocus
          autoComplete="off"
          placeholder="Juan Dela Cruz"
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
        />
        {showMore ? (
          <>
            <TextField label="Phone (optional)" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <TextField
              label="Notes (optional)"
              hint="For example: lives near the chapel"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </>
        ) : (
          <Button variant="quiet" size="sm" onClick={() => setShowMore(true)}>
            Add phone or notes
          </Button>
        )}
        {error && <Banner tone="error">{error}</Banner>}
      </form>
    </Sheet>
  );
}
