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

export type EditorMode = "edit" | "preview";

export type EditorPresentation = "modal" | "full";

export interface EditorSettings {
  autosave: boolean;
  defaultMode: EditorMode;
  presentation: EditorPresentation;
  showWordCount: boolean;
  closeModalOnBackdropClick: boolean;
}

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  autosave: true,
  defaultMode: "preview",
  presentation: "modal",
  showWordCount: true,
  closeModalOnBackdropClick: false,
};

export interface TrashSettings {
  retentionDays: TrashRetentionDays;
}

export const DEFAULT_TRASH_SETTINGS: TrashSettings = {
  retentionDays: TRASH_RETENTION_DAYS,
};

const isRetentionOption = (value: unknown): value is TrashRetentionDays =>
  TRASH_RETENTION_OPTIONS.some((option) => option.value === value);

export type ExportFormat = "md" | "json";

export interface ExportSettings {
  defaultFormat: ExportFormat;
}

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  defaultFormat: "json",
};

const EXPORT_FORMATS: ExportFormat[] = ["md", "json"];

const normalizeExportSettings = (
  settings: Partial<ExportSettings> | undefined,
): ExportSettings => ({
  defaultFormat: EXPORT_FORMATS.includes(settings?.defaultFormat as ExportFormat)
    ? (settings?.defaultFormat as ExportFormat)
    : DEFAULT_EXPORT_SETTINGS.defaultFormat,
});

export const SIDEBAR_WIDTH_MIN = 280;
export const SIDEBAR_WIDTH_MAX = 480;
export const SIDEBAR_WIDTH_DEFAULT = 360;

export type MotionPreference = "system" | "reduce" | "full";

export const DEFAULT_MOTION: MotionPreference = "system";

export type AccentColor =
  | "orange"
  | "blue"
  | "green"
  | "teal"
  | "violet"
  | "rose";

export type FontScale = "small" | "default" | "large";

export type Density = "compact" | "default" | "comfortable";

export type RadiusStyle = "default" | "square" | "rounded";

export interface AppearanceSettings {
  accent: AccentColor;
  fontScale: FontScale;
  density: Density;
  radius: RadiusStyle;
  highContrast: boolean;
}

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  accent: "orange",
  fontScale: "default",
  density: "default",
  radius: "default",
  highContrast: false,
};

export interface SidebarSettings {
  collapsed: boolean;
  width: number;
  showCounts: boolean;
}

export const DEFAULT_SIDEBAR_SETTINGS: SidebarSettings = {
  collapsed: false,
  width: SIDEBAR_WIDTH_DEFAULT,
  showCounts: true,
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

const EDITOR_MODES: EditorMode[] = ["edit", "preview"];
const EDITOR_PRESENTATIONS: EditorPresentation[] = ["modal", "full"];

const normalizeEditorSettings = (
  settings: Partial<EditorSettings> | undefined,
): EditorSettings => ({
  autosave: settings?.autosave ?? DEFAULT_EDITOR_SETTINGS.autosave,
  defaultMode: EDITOR_MODES.includes(settings?.defaultMode as EditorMode)
    ? (settings?.defaultMode as EditorMode)
    : DEFAULT_EDITOR_SETTINGS.defaultMode,
  presentation: EDITOR_PRESENTATIONS.includes(
    settings?.presentation as EditorPresentation,
  )
    ? (settings?.presentation as EditorPresentation)
    : DEFAULT_EDITOR_SETTINGS.presentation,
  showWordCount:
    settings?.showWordCount ?? DEFAULT_EDITOR_SETTINGS.showWordCount,
  closeModalOnBackdropClick:
    settings?.closeModalOnBackdropClick ??
    DEFAULT_EDITOR_SETTINGS.closeModalOnBackdropClick,
});

const normalizeTrashSettings = (
  settings: Partial<TrashSettings> | undefined,
): TrashSettings => ({
  retentionDays: isRetentionOption(settings?.retentionDays)
    ? settings.retentionDays
    : DEFAULT_TRASH_SETTINGS.retentionDays,
});

const isMotionPreference = (value: unknown): value is MotionPreference =>
  value === "system" || value === "reduce" || value === "full";

const normalizeMotion = (value: unknown): MotionPreference =>
  isMotionPreference(value) ? value : DEFAULT_MOTION;

const ACCENT_COLORS: AccentColor[] = [
  "orange",
  "blue",
  "green",
  "teal",
  "violet",
  "rose",
];

const FONT_SCALES: FontScale[] = ["small", "default", "large"];
const DENSITIES: Density[] = ["compact", "default", "comfortable"];
const RADIUS_STYLES: RadiusStyle[] = ["default", "square", "rounded"];

const normalizeAppearance = (
  settings: Partial<AppearanceSettings> | undefined,
): AppearanceSettings => ({
  accent: ACCENT_COLORS.includes(settings?.accent as AccentColor)
    ? (settings?.accent as AccentColor)
    : DEFAULT_APPEARANCE_SETTINGS.accent,
  fontScale: FONT_SCALES.includes(settings?.fontScale as FontScale)
    ? (settings?.fontScale as FontScale)
    : DEFAULT_APPEARANCE_SETTINGS.fontScale,
  density: DENSITIES.includes(settings?.density as Density)
    ? (settings?.density as Density)
    : DEFAULT_APPEARANCE_SETTINGS.density,
  radius: RADIUS_STYLES.includes(settings?.radius as RadiusStyle)
    ? (settings?.radius as RadiusStyle)
    : DEFAULT_APPEARANCE_SETTINGS.radius,
  highContrast:
    typeof settings?.highContrast === "boolean"
      ? settings.highContrast
      : DEFAULT_APPEARANCE_SETTINGS.highContrast,
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
  showCounts: settings?.showCounts ?? DEFAULT_SIDEBAR_SETTINGS.showCounts,
});

interface SettingsStore {
  toasts: ToastSettings;
  editor: EditorSettings;
  trash: TrashSettings;
  sidebar: SidebarSettings;
  motion: MotionPreference;
  appearance: AppearanceSettings;
  export: ExportSettings;
  setMotion: (motion: MotionPreference) => void;
  setAppearanceSettings: (partial: Partial<AppearanceSettings>) => void;
  resetAppearanceSettings: () => void;
  setToastSettings: (partial: Partial<ToastSettings>) => void;
  resetToastSettings: () => void;
  setEditorSettings: (partial: Partial<EditorSettings>) => void;
  resetEditorSettings: () => void;
  setTrashSettings: (partial: Partial<TrashSettings>) => void;
  setSidebarSettings: (partial: Partial<SidebarSettings>) => void;
  setExportSettings: (partial: Partial<ExportSettings>) => void;
}

const STORAGE_KEY = "settings";
const STORAGE_VERSION = 12;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      toasts: DEFAULT_TOAST_SETTINGS,
      editor: DEFAULT_EDITOR_SETTINGS,
      trash: DEFAULT_TRASH_SETTINGS,
      sidebar: DEFAULT_SIDEBAR_SETTINGS,
      motion: DEFAULT_MOTION,
      appearance: DEFAULT_APPEARANCE_SETTINGS,
      export: DEFAULT_EXPORT_SETTINGS,

      setMotion: (motion) => set({ motion: normalizeMotion(motion) }),

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

      setExportSettings: (partial) =>
        set((state) => ({
          export: normalizeExportSettings({ ...state.export, ...partial }),
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
        motion: state.motion,
        appearance: state.appearance,
        export: state.export,
      }),
      migrate: (persistedState) => {
        const state = persistedState as
          | {
              toasts?: Partial<ToastSettings>;
              editor?: Partial<EditorSettings>;
              trash?: Partial<TrashSettings>;
              sidebar?: Partial<SidebarSettings>;
              motion?: unknown;
              appearance?: Partial<AppearanceSettings>;
              export?: Partial<ExportSettings>;
            }
          | undefined;
        return {
          toasts: normalizeToastSettings(state?.toasts),
          editor: normalizeEditorSettings(state?.editor),
          trash: normalizeTrashSettings(state?.trash),
          sidebar: normalizeSidebarSettings(state?.sidebar),
          motion: normalizeMotion(state?.motion),
          appearance: normalizeAppearance(state?.appearance),
          export: normalizeExportSettings(state?.export),
        };
      },
      merge: (persistedState, currentState) => {
        const state = persistedState as
          | {
              toasts?: Partial<ToastSettings>;
              editor?: Partial<EditorSettings>;
              trash?: Partial<TrashSettings>;
              sidebar?: Partial<SidebarSettings>;
              motion?: unknown;
              appearance?: Partial<AppearanceSettings>;
              export?: Partial<ExportSettings>;
            }
          | undefined;
        return {
          ...currentState,
          toasts: normalizeToastSettings(state?.toasts),
          editor: normalizeEditorSettings(state?.editor),
          trash: normalizeTrashSettings(state?.trash),
          sidebar: normalizeSidebarSettings(state?.sidebar),
          motion: normalizeMotion(state?.motion),
          appearance: normalizeAppearance(state?.appearance),
          export: normalizeExportSettings(state?.export),
        };
      },
    },
  ),
);
