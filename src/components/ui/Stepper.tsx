import { useState } from 'react';

type Props = {
  value: number;
  onChange: (next: number) => void;
  /** Highest allowed value. The + button stops here. */
  max?: number;
  /** Describes what is being counted, for screen readers, e.g. "Quantity of Coffee". */
  label: string;
};

const button =
  'flex h-12 w-12 shrink-0 items-center justify-center rounded border-2 border-ink bg-field font-display text-3xl font-bold leading-none active:bg-sand disabled:opacity-30';

/** [-] 3 [+]  The number can also be typed. */
export function Stepper({ value, onChange, max, label }: Props) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-1.5">
      <button type="button" className={button} aria-label={`One less. ${label}`} onClick={() => onChange(value - 1)}>
        −
      </button>
      <input
        aria-label={label}
        inputMode="numeric"
        value={draft ?? String(value)}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, 5);
          setDraft(digits);
          if (digits !== '') onChange(Number(digits));
        }}
        onBlur={() => setDraft(null)}
        className="h-12 w-14 rounded border-2 border-transparent bg-transparent text-center font-display text-2xl font-extrabold tabular-nums focus:border-ink"
      />
      <button
        type="button"
        className={button}
        aria-label={`One more. ${label}`}
        disabled={max !== undefined && value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}
