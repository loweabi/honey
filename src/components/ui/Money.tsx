import { formatAmount } from '../../lib/money';

/**
 * A peso amount where the ₱ and the centavos are smaller than the pesos,
 * so the number people are looking for is the first thing they see.
 * Size it with a text-size class: <Money value={75} className="text-4xl" />
 */
export function Money({ value, className = '' }: { value: number; className?: string }) {
  const [pesos, centavos] = formatAmount(Math.abs(value)).split('.');
  return (
    <span className={`whitespace-nowrap font-display font-extrabold tabular-nums leading-none ${className}`}>
      {value < 0 && '-'}
      <span className="mr-[0.06em] text-[0.55em] font-bold">₱</span>
      {pesos}
      <span className="text-[0.55em] font-bold">.{centavos}</span>
    </span>
  );
}
