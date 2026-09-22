import type { ReactNode } from 'react';

type Tone = 'error' | 'info' | 'ok';

const tones: Record<Tone, string> = {
  error: 'border-brick bg-brick-wash text-brick',
  info: 'border-honey bg-honey-wash text-ink',
  ok: 'border-olive bg-olive-wash text-olive',
};

export function Banner({ tone = 'info', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`border-l-4 px-3 py-2.5 text-[15px] font-medium ${tones[tone]}`}>
      {children}
    </div>
  );
}
