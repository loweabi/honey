import type { InputHTMLAttributes, ReactNode } from 'react';

const inputClass =
  'h-14 w-full rounded border-2 border-ink bg-field px-3 text-lg text-ink placeholder:text-ink-soft/60 focus:border-honey-deep';

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
};

function Wrapper({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[15px] font-semibold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-sm text-ink-soft">{hint}</span>}
    </label>
  );
}

export function TextField({ label, hint, className = '', ...rest }: FieldProps) {
  return (
    <Wrapper label={label} hint={hint}>
      <input className={`${inputClass} ${className}`} {...rest} />
    </Wrapper>
  );
}

/** Money entry with a ₱ in front. Keeps the raw text; parse it with parseAmount. */
export function MoneyField({ label, hint, className = '', ...rest }: FieldProps) {
  return (
    <Wrapper label={label} hint={hint}>
      <span className="relative block">
        <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-display text-xl font-bold text-ink-soft">
          ₱
        </span>
        <input inputMode="decimal" autoComplete="off" className={`${inputClass} pl-9 font-display font-bold ${className}`} {...rest} />
      </span>
    </Wrapper>
  );
}

export function NumberField({ label, hint, className = '', ...rest }: FieldProps) {
  return (
    <Wrapper label={label} hint={hint}>
      <input inputMode="numeric" autoComplete="off" className={`${inputClass} font-display font-bold ${className}`} {...rest} />
    </Wrapper>
  );
}

export { inputClass };
