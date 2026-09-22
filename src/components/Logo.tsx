/** The hexagon mark plus the store name. */
export function Logo({ className = 'text-xl' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display font-extrabold tracking-tight ${className}`}>
      <svg viewBox="0 0 64 64" className="h-[1.1em] w-[1.1em]" aria-hidden>
        <path d="M32 4l24 14v28L32 60 8 46V18z" fill="#E2A61F" stroke="#262421" strokeWidth="5" strokeLinejoin="round" />
        <path d="M32 21l9 5v12l-9 5-9-5V26z" fill="#262421" />
      </svg>
      Honey Inventory
    </span>
  );
}
