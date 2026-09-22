import { isLowButAvailable, isOutOfStock, stockLabel } from '../../lib/stock';
import type { Product } from '../../types';
import { Button } from '../ui/Button';
import { Money } from '../ui/Money';
import { Stepper } from '../ui/Stepper';
import { Tag } from '../ui/Tag';

type Props = {
  product: Product;
  quantityInSale: number;
  onSetQuantity: (quantity: number) => void;
  onRestock: () => void;
};

/** One search result: the price is the biggest thing on the row. */
export function ProductResult({ product, quantityInSale, onSetQuantity, onRestock }: Props) {
  const out = isOutOfStock(product);
  const low = isLowButAvailable(product);

  return (
    <li className={`border-b-2 border-line px-2 py-3 ${quantityInSale > 0 ? 'bg-honey-wash' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 pt-1 font-display text-xl font-semibold leading-tight">{product.name}</h3>
        <Money value={product.selling_price} className="text-[40px]" />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="flex flex-wrap items-center gap-2 text-base font-medium">
          <span className={out ? 'text-brick' : low ? 'text-brick' : 'text-olive'}>{stockLabel(product)}</span>
          {out && <Tag tone="warn">OUT OF STOCK</Tag>}
          {low && <Tag tone="warn">LOW STOCK</Tag>}
        </p>
        {out ? (
          <Button variant="outline" size="sm" onClick={onRestock}>
            + ADD STOCK
          </Button>
        ) : quantityInSale > 0 ? (
          <Stepper
            label={`Quantity of ${product.name}`}
            value={quantityInSale}
            max={product.stock_quantity}
            onChange={onSetQuantity}
          />
        ) : (
          <Button variant="honey" className="w-28" onClick={() => onSetQuantity(1)}>
            ADD
          </Button>
        )}
      </div>
    </li>
  );
}
