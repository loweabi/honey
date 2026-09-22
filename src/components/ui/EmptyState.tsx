import type { ReactNode } from 'react';

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="border-2 border-dashed border-line px-5 py-10 text-center">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      {children && <p className="mx-auto mt-1 max-w-sm text-ink-soft">{children}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
