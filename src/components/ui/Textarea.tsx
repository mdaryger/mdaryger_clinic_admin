import { forwardRef, type TextareaHTMLAttributes } from 'react';

import { cn } from '../../utils/cn';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, rows = 4, ...props }, ref) => (
    <label className="block">
      {label ? <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span> : null}
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/15',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-100',
          className,
        )}
        {...props}
      />
      {error ? <span className="mt-1 block text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  ),
);

Textarea.displayName = 'Textarea';
