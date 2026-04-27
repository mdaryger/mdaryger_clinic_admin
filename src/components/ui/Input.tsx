import { forwardRef, type InputHTMLAttributes } from 'react';

import { cn } from '../../utils/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, error, id, ...props }, ref) => {
  const inputId = id ?? props.name;

  return (
    <label className="block">
      {label ? <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span> : null}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/15',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-100',
          className,
        )}
        {...props}
      />
      {error ? <span className="mt-1 block text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
});

Input.displayName = 'Input';
