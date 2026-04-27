import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

import { cn } from '../../utils/cn';

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: ReactNode;
  description?: string;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, ...props }, ref) => (
    <label className="flex items-start gap-3">
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          'mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/25',
          className,
        )}
        {...props}
      />
      <span>
        {label ? <span className="block text-sm font-medium text-slate-800">{label}</span> : null}
        {description ? <span className="block text-sm text-slate-500">{description}</span> : null}
      </span>
    </label>
  ),
);

Checkbox.displayName = 'Checkbox';
