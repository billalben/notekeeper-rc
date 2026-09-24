import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_LANGUAGE, type Language } from "@/app/i18n";
import {
  DEFAULT_SHORTCUTS,
  normalizeChord,
  type ActionId,
  type ShortcutBindings,
} from "@/shared/lib/shortcuts";
import {
  DEFAULT_APPEARANCE_SETTINGS,
  DEFAULT_EDITOR_SETTINGS,
  DEFAULT_EXPORT_SETTINGS,
  DEFAULT_HEADER_SETTINGS,
  DEFAULT_MOTION,
  DEFAULT_SIDEBAR_SETTINGS,
  DEFAULT_TOAST_SETTINGS,
  DEFAULT_TRASH_SETTINGS,
} from "./settings/defaults";
import {
  normalizeAppearance,
  normalizeEditorSettings,
  normalizeExportSettings,
  normalizeHeaderSettings,
  normalizeLanguage,
  normalizeMotion,
  normalizePersistedSettings,
  normalizeSidebarSettings,
  normalizeToastSettings,
  normalizeTrashSettings,
  type PersistedSettings,
} from "./settings/normalizers";
import type {
  AppearanceSettings,
  EditorSettings,
  ExportSettings,
  HeaderSettings,
  MotionPreference,
  SidebarSettings,
  ToastSettings,
  TrashSettings,
} from "./settings/types";

export type {
  AccentColor,
  Density,
  EditorMode,
  EditorPresentation,
  ExportFormat,
  FontScale,
  MotionPreference,
  RadiusStyle,
} from "./settings/types";

export {
  DEFAULT_APPEARANCE_SETTINGS,
  SIDEBAR_WIDTH_MAX,
  SIDEBAR_WIDTH_MIN,
  SPLIT_WIDTH_MAX,
  SPLIT_WIDTH_MIN,
  TOAST_DURATION_MAX,
  TOAST_DURATION_MIN,
  TOAST_MAX_VISIBLE_MAX,
  TOAST_MAX_VISIBLE_MIN,
} from "./settings/defaults";

interface SettingsStore {
  toasts: ToastSettings;
  editor: EditorSettings;
  trash: TrashSettings;
  sidebar: SidebarSettings;
  header: HeaderSettings;
  motion: MotionPreference;
  language: Language;
  appearance: AppearanceSettings;
  export: ExportSettings;
  shortcuts: ShortcutBindings;
  setMotion: (motion: MotionPreference) => void;
  setLanguage: (language: Language) => void;
  setAppearanceSettings: (partial: Partial<AppearanceSettings>) => void;
  resetAppearanceSettings: () => void;
  setToastSettings: (partial: Partial<ToastSettings>) => void;
  resetToastSettings: () => void;
  setEditorSettings: (partial: Partial<EditorSettings>) => void;
  resetEditorSettings: () => void;
  setTrashSettings: (partial: Partial<TrashSettings>) => void;
  setSidebarSettings: (partial: Partial<SidebarSettings>) => void;
  setHeaderSettings: (partial: Partial<HeaderSettings>) => void;
  setExportSettings: (partial: Partial<ExportSettings>) => void;
  setShortcut: (actionId: ActionId, chord: string) => void;
  resetShortcut: (actionId: ActionId) => void;
  resetAllShortcuts: () => void;
}

const STORAGE_KEY = "settings";
const STORAGE_VERSION = 18;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      toasts: DEFAULT_TOAST_SETTINGS,
      editor: DEFAULT_EDITOR_SETTINGS,
      trash: DEFAULT_TRASH_SETTINGS,
      sidebar: DEFAULT_SIDEBAR_SETTINGS,
      header: DEFAULT_HEADER_SETTINGS,
      motion: DEFAULT_MOTION,
      language: DEFAULT_LANGUAGE,
      appearance: DEFAULT_APPEARANCE_SETTINGS,
      export: DEFAULT_EXPORT_SETTINGS,
      shortcuts: DEFAULT_SHORTCUTS,

      setMotion: (motion) => set({ motion: normalizeMotion(motion) }),

      setLanguage: (language) => set({ language: normalizeLanguage(language) }),

      setAppearanceSettings: (partial) =>
        set((state) => ({
          appearance: normalizeAppearance({ ...state.appearance, ...partial }),
        })),

      resetAppearanceSettings: () =>
        set({ appearance: DEFAULT_APPEARANCE_SETTINGS }),

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

      setHeaderSettings: (partial) =>
        set((state) => ({
          header: normalizeHeaderSettings({ ...state.header, ...partial }),
        })),

      setExportSettings: (partial) =>
        set((state) => ({
          export: normalizeExportSettings({ ...state.export, ...partial }),
        })),

      setShortcut: (actionId, chord) =>
        set((state) => ({
          shortcuts: {
            ...state.shortcuts,
            [actionId]: normalizeChord(chord) || DEFAULT_SHORTCUTS[actionId],
          },
        })),

      resetShortcut: (actionId) =>
        set((state) => ({
          shortcuts: {
            ...state.shortcuts,
            [actionId]: DEFAULT_SHORTCUTS[actionId],
          },
        })),

      resetAllShortcuts: () => set({ shortcuts: DEFAULT_SHORTCUTS }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      partialize: (state) => ({
        toasts: state.toasts,
        editor: state.editor,
        trash: state.trash,
        sidebar: state.sidebar,
        header: state.header,
        motion: state.motion,
        language: state.language,
        appearance: state.appearance,
        export: state.export,
        shortcuts: state.shortcuts,
      }),
      migrate: (persistedState) =>
        normalizePersistedSettings(persistedState as PersistedSettings),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...normalizePersistedSettings(persistedState as PersistedSettings),
      }),
    },
  ),
);
