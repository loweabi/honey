import type { ReactNode } from 'react';

type Tone = 'warn' | 'ok' | 'neutral' | 'honey';

const tones: Record<Tone, string> = {
  warn: 'bg-brick-wash text-brick',
  ok: 'bg-olive-wash text-olive',
  neutral: 'bg-sand text-ink-soft',
  honey: 'bg-honey-wash text-honey-deep',
};

export function Tag({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-block rounded-sm px-2 py-0.5 text-xs font-bold tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}
