import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Pinned to the bottom, always visible (e.g. the main save button). */
  footer?: ReactNode;
};

/** A panel that slides up on phones and centers on bigger screens. */
export function Sheet({ title, onClose, children, footer }: Props) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (panel.current && !panel.current.contains(document.activeElement)) panel.current.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            onClose();
          }
        }}
        className="sheet-in relative flex max-h-[94dvh] w-full flex-col border-t-4 border-ink bg-paper outline-none md:max-w-lg md:border-4"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b-2 border-line pl-4 pr-1">
          <h2 id={titleId} className="font-display text-xl font-bold">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="h-11 rounded px-4 text-[15px] font-bold underline underline-offset-4">
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer && <div className="shrink-0 border-t-2 border-line bg-paper px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
