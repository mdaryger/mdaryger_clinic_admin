import { forwardRef, type SelectHTMLAttributes } from 'react';

import { cn } from '../../utils/cn';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, label, error, children, ...props }, ref) => (
  <label className="block">
    {label ? <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span> : null}
    <select
      ref={ref}
      className={cn(
        'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15',
        error && 'border-red-300 focus:border-red-500 focus:ring-red-100',
        className,
      )}
      {...props}
    >
      {children}
    </select>
    {error ? <span className="mt-1 block text-xs font-medium text-red-600">{error}</span> : null}
  </label>
));

Select.displayName = 'Select';
