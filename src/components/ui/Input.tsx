import { forwardRef, type ChangeEvent, type FocusEvent, type InputHTMLAttributes, type KeyboardEvent } from 'react';

import { cn } from '../../utils/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

const PHONE_PREFIX = '+996';

function isPhoneInput(props: InputHTMLAttributes<HTMLInputElement>): boolean {
  const name = typeof props.name === 'string' ? props.name.toLowerCase() : '';

  return props.type === 'tel' || name.includes('phone');
}

function normalizePhoneValue(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return PHONE_PREFIX;
  }

  const digits = trimmed.replace(/\D/g, '');
  const suffix = (digits.startsWith('996') ? digits.slice(3) : digits).slice(0, 9);
  const groups = [suffix.slice(0, 3), suffix.slice(3, 6), suffix.slice(6, 9)].filter(Boolean);

  return [PHONE_PREFIX, ...groups].join(' ');
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, error, id, onChange, onFocus, onKeyDown, value, defaultValue, ...props }, ref) => {
  const inputId = id ?? props.name;
  const phoneInput = isPhoneInput({ ...props, value, defaultValue });
  const normalizedValue = phoneInput && typeof value === 'string' ? normalizePhoneValue(value) : value;
  const normalizedDefaultValue =
    phoneInput && typeof defaultValue === 'string'
      ? normalizePhoneValue(defaultValue)
      : phoneInput && defaultValue === undefined && value === undefined
        ? PHONE_PREFIX
        : defaultValue;

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    if (phoneInput && !event.target.value) {
      event.target.value = PHONE_PREFIX;
    }

    onFocus?.(event);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (phoneInput) {
      event.target.value = normalizePhoneValue(event.target.value);
    }

    onChange?.(event);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (
      phoneInput &&
      (event.key === 'Backspace' || event.key === 'Delete') &&
      event.currentTarget.selectionStart !== null &&
      event.currentTarget.selectionStart <= PHONE_PREFIX.length &&
      event.currentTarget.selectionEnd !== null &&
      event.currentTarget.selectionEnd <= PHONE_PREFIX.length
    ) {
      event.preventDefault();
      return;
    }

    onKeyDown?.(event);
  };

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
        type={phoneInput ? 'tel' : props.type}
        value={normalizedValue}
        defaultValue={normalizedDefaultValue}
        onFocus={handleFocus}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...props}
      />
      {error ? <span className="mt-1 block text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
});

Input.displayName = 'Input';
