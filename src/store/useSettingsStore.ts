import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ToastPosition } from "../types";

export const TOAST_DURATION_MIN = 1000;
export const TOAST_DURATION_MAX = 6000;
export const TOAST_MAX_VISIBLE_MIN = 1;
export const TOAST_MAX_VISIBLE_MAX = 5;

export interface ToastSettings {
  enabled: boolean;
  position: ToastPosition;
  duration: number;
  maxVisible: number;
  showCloseButton: boolean;
}

export const DEFAULT_TOAST_SETTINGS: ToastSettings = {
  enabled: true,
  position: "bottom-center",
  duration: 4000,
  maxVisible: 3,
  showCloseButton: true,
};

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const normalizeToastSettings = (
  settings: Partial<ToastSettings> | undefined,
): ToastSettings => ({
  ...DEFAULT_TOAST_SETTINGS,
  ...settings,
  duration: clamp(
    settings?.duration ?? DEFAULT_TOAST_SETTINGS.duration,
    TOAST_DURATION_MIN,
    TOAST_DURATION_MAX,
  ),
  maxVisible: clamp(
    settings?.maxVisible ?? DEFAULT_TOAST_SETTINGS.maxVisible,
    TOAST_MAX_VISIBLE_MIN,
    TOAST_MAX_VISIBLE_MAX,
  ),
});

interface SettingsStore {
  toasts: ToastSettings;
  setToastSettings: (partial: Partial<ToastSettings>) => void;
  resetToastSettings: () => void;
}

const STORAGE_KEY = "settings";
const STORAGE_VERSION = 1;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      toasts: DEFAULT_TOAST_SETTINGS,

      setToastSettings: (partial) =>
        set((state) => ({
          toasts: normalizeToastSettings({ ...state.toasts, ...partial }),
        })),

      resetToastSettings: () => set({ toasts: DEFAULT_TOAST_SETTINGS }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      partialize: (state) => ({ toasts: state.toasts }),
      migrate: (persistedState) => {
        const state = persistedState as
          | { toasts?: Partial<ToastSettings> }
          | undefined;
        return { toasts: normalizeToastSettings(state?.toasts) };
      },
    },
  ),
);
