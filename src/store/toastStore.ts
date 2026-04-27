import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export type Toast = {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
};

type ToastInput = Omit<Toast, 'id'>;

type ToastStore = {
  toasts: Toast[];
  showToast: (toast: ToastInput) => void;
  removeToast: (id: string) => void;
};

function createToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  showToast: (toast) => {
    const id = createToastId();

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    window.setTimeout(() => {
      useToastStore.getState().removeToast(id);
    }, 4500);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));
