import { writable } from 'svelte/store';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  function showToast(type: Toast['type'], message: string, duration = 3000) {
    const id = Math.random().toString(36).substr(2, 9);
    update((toasts) => [...toasts, { id, type, message, duration }]);
    setTimeout(() => {
      update((toasts) => toasts.filter((t) => t.id !== id));
    }, duration);
  }

  function removeToast(id: string) {
    update((toasts) => toasts.filter((t) => t.id !== id));
  }

  return {
    subscribe,
    showToast,
    removeToast,
  };
}

export const toastStore = createToastStore();
