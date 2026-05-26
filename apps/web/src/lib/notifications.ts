"use client";

import { create } from "zustand";

export interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  /** Optional “Undo” button. Only shown when present. */
  action?: { label: string; run: () => void };
  /** Auto-dismiss after this many ms. Defaults to 3500. */
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = `t${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const duration = t.duration ?? 3500;
    const toast: Toast = { id, ...t };
    set((s) => ({ toasts: [...s.toasts, toast] }));
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
      }, duration);
    }
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export function toast(t: Omit<Toast, "id">) {
  return useToastStore.getState().push(t);
}
