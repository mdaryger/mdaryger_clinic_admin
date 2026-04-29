import type { HTMLAttributes } from 'react';

import { cn } from '../../utils/cn';

export type BadgeTone = 'slate' | 'primary' | 'green' | 'yellow' | 'red' | 'blue' | 'orange' | 'teal';

const tones: Record<BadgeTone, string> = {
  slate: 'bg-slate-100 text-slate-700',
  primary: 'bg-primary/10 text-primary',
  green: 'bg-emerald-50 text-emerald-700',
  yellow: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  blue: 'bg-sky-50 text-sky-700',
  orange: 'bg-orange-50 text-orange-700',
  teal: 'bg-teal-50 text-teal-700',
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export function Badge({ className, tone = 'slate', ...props }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone], className)}
      {...props}
    />
  );
}
