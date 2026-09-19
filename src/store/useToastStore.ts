import { create } from "zustand";
import type { ToastType } from "../types";
import { generateID } from "../utils";
import {
  clamp,
  TOAST_DURATION_MAX,
  TOAST_DURATION_MIN,
  useSettingsStore,
} from "./useSettingsStore";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  description?: string;
  duration?: number;
  action?: ToastAction;
  actions?: ToastAction[];
}

export interface ToastInput extends ToastOptions {
  type: ToastType;
  message: string;
}

export interface ToastItem extends ToastInput {
  id: string;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (input: ToastInput) => string | undefined;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (input) => {
    const { enabled, maxVisible } = useSettingsStore.getState().toasts;
    if (!enabled) return undefined;

    const id = generateID();
    const toast: ToastItem = {
      ...input,
      id,
      duration:
        input.duration === undefined
          ? undefined
          : clamp(input.duration, TOAST_DURATION_MIN, TOAST_DURATION_MAX),
    };

    set((state) => ({
      toasts: [...state.toasts, toast].slice(-maxVisible),
    }));

    return id;
  },

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),
}));

const show = (input: ToastInput) => useToastStore.getState().addToast(input);

export const toast = {
  show,
  success: (message: string, options?: ToastOptions) =>
    show({ type: "success", message, ...options }),
  error: (message: string, options?: ToastOptions) =>
    show({ type: "error", message, ...options }),
  info: (message: string, options?: ToastOptions) =>
    show({ type: "info", message, ...options }),
  dismiss: (id: string) => useToastStore.getState().dismissToast(id),
  dismissAll: () => useToastStore.getState().clearToasts(),
};
