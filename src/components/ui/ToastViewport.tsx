import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

import { useToastStore, type ToastType } from '../../store/toastStore';
import { cn } from '../../utils/cn';

const toastStyles: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
};

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function ToastViewport() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed right-4 top-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];

        return (
          <div
            key={toast.id}
            className={cn('rounded-lg border p-4 shadow-lg backdrop-blur', toastStyles[toast.type])}
            role="status"
          >
            <div className="flex gap-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? <p className="mt-1 text-sm opacity-80">{toast.description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md opacity-70 hover:bg-black/5 hover:opacity-100"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
