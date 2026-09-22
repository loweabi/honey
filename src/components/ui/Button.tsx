import type { ButtonHTMLAttributes } from 'react';

type Variant = 'honey' | 'ink' | 'outline' | 'danger' | 'quiet';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  honey: 'bg-honey text-ink border-2 border-ink hover:brightness-95',
  ink: 'bg-ink text-paper border-2 border-ink hover:bg-black',
  outline: 'bg-field text-ink border-2 border-ink hover:bg-sand',
  danger: 'bg-field text-brick border-2 border-brick hover:bg-brick-wash',
  quiet: 'bg-transparent text-ink border-2 border-transparent underline underline-offset-4 hover:bg-sand',
};

const sizes: Record<Size, string> = {
  sm: 'h-11 px-4 text-[15px]',
  md: 'h-12 px-5 text-base',
  lg: 'h-14 px-6 text-lg',
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  full?: boolean;
};

export function Button({ variant = 'outline', size = 'md', full = false, className = '', type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded font-display font-bold tracking-tight
        transition-colors active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40
        ${variants[variant]} ${sizes[size]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    />
  );
}
