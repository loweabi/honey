import { isOutOfStock } from '../../lib/stock';
import type { Product } from '../../types';
import { Money } from '../ui/Money';

/** Keeps names like Coca-Cola from splitting at the hyphen in a narrow tile. */
const noBreakHyphens = (name: string): string => name.replace(/-/g, '\u2011');

type Props = {
  products: Product[];
  quantityOf: (productId: string) => number;
  onAdd: (productId: string) => void;
};

/** A few favorite products the owner picked. One tap adds one to the sale. */
export function QuickSell({ products, quantityOf, onAdd }: Props) {
  return (
    <section aria-labelledby="quick-sell-title">
      <h2 id="quick-sell-title" className="mb-2 font-display text-lg font-bold">
        Quick sell
      </h2>
      <ul className="grid grid-cols-3 gap-2">
        {products.map((product) => {
          const inSale = quantityOf(product.id);
          const out = isOutOfStock(product);
          return (
            <li key={product.id}>
              <button
                type="button"
                disabled={out}
                onClick={() => onAdd(product.id)}
                className={`flex h-full min-h-[112px] w-full flex-col items-start justify-between rounded border-2 border-ink p-2.5 text-left transition-colors active:translate-y-px
                  ${inSale > 0 ? 'bg-honey-wash' : 'bg-field'} ${out ? 'opacity-50' : 'hover:bg-sand'}`}
              >
                <span className="line-clamp-3 break-words font-display text-[15px] font-semibold leading-tight">{noBreakHyphens(product.name)}</span>
                <span className="mt-2 flex w-full flex-col">
                  <span className="flex w-full items-end justify-between gap-1">
                    <Money value={product.selling_price} className="text-2xl" />
                    {inSale > 0 && (
                      <span className="mb-0.5 min-w-6 rounded-sm bg-ink px-1.5 text-center font-display text-sm font-bold text-paper">
                        ×{inSale}
                      </span>
                    )}
                  </span>
                  {out && <span className="mt-1 text-xs font-bold text-brick">OUT OF STOCK</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
