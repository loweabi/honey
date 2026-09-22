import { formatPeso } from '../../lib/money';
import { useSale } from '../../state/SaleContext';
import { Money } from '../ui/Money';

/** Phone only: always-visible total that opens the full sale. */
export function SaleBar({ onOpen }: { onOpen: () => void }) {
  const sale = useSale();

  if (sale.lines.length === 0 && !sale.receipt) return null;

  const base =
    'fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 flex h-[72px] w-full items-center justify-between gap-3 border-t-2 border-ink px-4 text-left';

  if (sale.lines.length === 0 && sale.receipt) {
    return (
      <button type="button" onClick={onOpen} className={`${base} bg-olive text-paper`}>
        <span className="font-display text-lg font-bold">Sale saved</span>
        <span className="font-display text-lg font-bold">
          {sale.receipt.change ? `Change ${formatPeso(sale.receipt.change)}` : 'Tap to view'}
        </span>
      </button>
    );
  }

  return (
    <button type="button" onClick={onOpen} className={`${base} bg-honey`} aria-label="Open the current sale">
      <span>
        <span className="block text-sm font-bold">
          {sale.itemCount} {sale.itemCount === 1 ? 'item' : 'items'}
        </span>
        <span className="block font-display text-lg font-bold leading-tight">VIEW SALE</span>
      </span>
      <span className="text-right">
        <span className="block text-sm font-bold">TOTAL</span>
        <Money value={sale.total} className="text-[34px]" />
      </span>
    </button>
  );
}
