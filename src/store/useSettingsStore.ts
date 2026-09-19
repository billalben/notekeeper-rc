import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ToastPosition } from "../types";
import {
  TRASH_RETENTION_DAYS,
  TRASH_RETENTION_OPTIONS,
  type TrashRetentionDays,
} from "../utils";

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

export interface EditorSettings {
  showWordCount: boolean;
}

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  showWordCount: true,
};

export interface TrashSettings {
  retentionDays: TrashRetentionDays;
}

export const DEFAULT_TRASH_SETTINGS: TrashSettings = {
  retentionDays: TRASH_RETENTION_DAYS,
};

const isRetentionOption = (value: unknown): value is TrashRetentionDays =>
  TRASH_RETENTION_OPTIONS.some((option) => option.value === value);

export const SIDEBAR_WIDTH_MIN = 280;
export const SIDEBAR_WIDTH_MAX = 480;
export const SIDEBAR_WIDTH_DEFAULT = 360;

export interface SidebarSettings {
  collapsed: boolean;
  width: number;
}

export const DEFAULT_SIDEBAR_SETTINGS: SidebarSettings = {
  collapsed: false,
  width: SIDEBAR_WIDTH_DEFAULT,
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

const normalizeEditorSettings = (
  settings: Partial<EditorSettings> | undefined,
): EditorSettings => ({
  ...DEFAULT_EDITOR_SETTINGS,
  ...settings,
});

const normalizeTrashSettings = (
  settings: Partial<TrashSettings> | undefined,
): TrashSettings => ({
  retentionDays: isRetentionOption(settings?.retentionDays)
    ? settings.retentionDays
    : DEFAULT_TRASH_SETTINGS.retentionDays,
});

const normalizeSidebarSettings = (
  settings: Partial<SidebarSettings> | undefined,
): SidebarSettings => ({
  collapsed: settings?.collapsed ?? DEFAULT_SIDEBAR_SETTINGS.collapsed,
  width: clamp(
    settings?.width ?? DEFAULT_SIDEBAR_SETTINGS.width,
    SIDEBAR_WIDTH_MIN,
    SIDEBAR_WIDTH_MAX,
  ),
});

interface SettingsStore {
  toasts: ToastSettings;
  editor: EditorSettings;
  trash: TrashSettings;
  sidebar: SidebarSettings;
  setToastSettings: (partial: Partial<ToastSettings>) => void;
  resetToastSettings: () => void;
  setEditorSettings: (partial: Partial<EditorSettings>) => void;
  resetEditorSettings: () => void;
  setTrashSettings: (partial: Partial<TrashSettings>) => void;
  setSidebarSettings: (partial: Partial<SidebarSettings>) => void;
}

const STORAGE_KEY = "settings";
const STORAGE_VERSION = 4;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      toasts: DEFAULT_TOAST_SETTINGS,
      editor: DEFAULT_EDITOR_SETTINGS,
      trash: DEFAULT_TRASH_SETTINGS,
      sidebar: DEFAULT_SIDEBAR_SETTINGS,

      setToastSettings: (partial) =>
        set((state) => ({
          toasts: normalizeToastSettings({ ...state.toasts, ...partial }),
        })),

      resetToastSettings: () => set({ toasts: DEFAULT_TOAST_SETTINGS }),

      setEditorSettings: (partial) =>
        set((state) => ({
          editor: normalizeEditorSettings({ ...state.editor, ...partial }),
        })),

      resetEditorSettings: () => set({ editor: DEFAULT_EDITOR_SETTINGS }),

      setTrashSettings: (partial) =>
        set((state) => ({
          trash: normalizeTrashSettings({ ...state.trash, ...partial }),
        })),

      setSidebarSettings: (partial) =>
        set((state) => ({
          sidebar: normalizeSidebarSettings({ ...state.sidebar, ...partial }),
        })),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      partialize: (state) => ({
        toasts: state.toasts,
        editor: state.editor,
        trash: state.trash,
        sidebar: state.sidebar,
      }),
      migrate: (persistedState) => {
        const state = persistedState as
          | {
              toasts?: Partial<ToastSettings>;
              editor?: Partial<EditorSettings>;
              trash?: Partial<TrashSettings>;
              sidebar?: Partial<SidebarSettings>;
            }
          | undefined;
        return {
          toasts: normalizeToastSettings(state?.toasts),
          editor: normalizeEditorSettings(state?.editor),
          trash: normalizeTrashSettings(state?.trash),
          sidebar: normalizeSidebarSettings(state?.sidebar),
        };
      },
    },
  ),
);
