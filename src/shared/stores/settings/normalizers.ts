import { DEFAULT_LANGUAGE, isLanguage, type Language } from "@/app/i18n";
import {
  TRASH_RETENTION_OPTIONS,
  type TrashRetentionDays,
} from "@/shared/lib/constants";
import { clamp } from "@/shared/lib/math";
import {
  normalizeShortcuts,
  type ShortcutBindings,
} from "@/shared/lib/shortcuts";
import {
  ACCENT_COLORS,
  DENSITIES,
  DEFAULT_APPEARANCE_SETTINGS,
  DEFAULT_EDITOR_SETTINGS,
  DEFAULT_EXPORT_SETTINGS,
  DEFAULT_HEADER_SETTINGS,
  DEFAULT_MOTION,
  DEFAULT_SIDEBAR_SETTINGS,
  DEFAULT_TOAST_SETTINGS,
  DEFAULT_TRASH_SETTINGS,
  EDITOR_MODES,
  EDITOR_PRESENTATIONS,
  EXPORT_FORMATS,
  FONT_SCALES,
  RADIUS_STYLES,
  SIDEBAR_WIDTH_MAX,
  SIDEBAR_WIDTH_MIN,
  SPLIT_WIDTH_MAX,
  SPLIT_WIDTH_MIN,
  TOAST_DURATION_MAX,
  TOAST_DURATION_MIN,
  TOAST_MAX_VISIBLE_MAX,
  TOAST_MAX_VISIBLE_MIN,
} from "./defaults";
import type {
  AccentColor,
  AppearanceSettings,
  Density,
  EditorMode,
  EditorPresentation,
  EditorSettings,
  ExportFormat,
  ExportSettings,
  FontScale,
  HeaderSettings,
  MotionPreference,
  RadiusStyle,
  SidebarSettings,
  ToastSettings,
  TrashSettings,
} from "./types";

const isRetentionOption = (value: unknown): value is TrashRetentionDays =>
  TRASH_RETENTION_OPTIONS.some((option) => option === value);

export const normalizeExportSettings = (
  settings: Partial<ExportSettings> | undefined,
): ExportSettings => ({
  defaultFormat: EXPORT_FORMATS.includes(
    settings?.defaultFormat as ExportFormat,
  )
    ? (settings?.defaultFormat as ExportFormat)
    : DEFAULT_EXPORT_SETTINGS.defaultFormat,
});

export const normalizeHeaderSettings = (
  settings: Partial<HeaderSettings> | undefined,
): HeaderSettings => ({
  showSearch: settings?.showSearch ?? DEFAULT_HEADER_SETTINGS.showSearch,
  showShortcuts:
    settings?.showShortcuts ?? DEFAULT_HEADER_SETTINGS.showShortcuts,
  showTheme: settings?.showTheme ?? DEFAULT_HEADER_SETTINGS.showTheme,
});

export const normalizeToastSettings = (
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

export const normalizeEditorSettings = (
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
  splitWidth: clamp(
    settings?.splitWidth ?? DEFAULT_EDITOR_SETTINGS.splitWidth,
    SPLIT_WIDTH_MIN,
    SPLIT_WIDTH_MAX,
  ),
  showWordCount:
    settings?.showWordCount ?? DEFAULT_EDITOR_SETTINGS.showWordCount,
  closeModalOnBackdropClick:
    settings?.closeModalOnBackdropClick ??
    DEFAULT_EDITOR_SETTINGS.closeModalOnBackdropClick,
});

export const normalizeTrashSettings = (
  settings: Partial<TrashSettings> | undefined,
): TrashSettings => ({
  retentionDays: isRetentionOption(settings?.retentionDays)
    ? settings.retentionDays
    : DEFAULT_TRASH_SETTINGS.retentionDays,
});

const isMotionPreference = (value: unknown): value is MotionPreference =>
  value === "system" || value === "reduce" || value === "full";

export const normalizeMotion = (value: unknown): MotionPreference =>
  isMotionPreference(value) ? value : DEFAULT_MOTION;

export const normalizeLanguage = (value: unknown): Language =>
  isLanguage(value) ? value : DEFAULT_LANGUAGE;

export const normalizeAppearance = (
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

export const normalizeSidebarSettings = (
  settings: Partial<SidebarSettings> | undefined,
): SidebarSettings => ({
  width: clamp(
    settings?.width ?? DEFAULT_SIDEBAR_SETTINGS.width,
    SIDEBAR_WIDTH_MIN,
    SIDEBAR_WIDTH_MAX,
  ),
  notebooksCollapsed:
    typeof settings?.notebooksCollapsed === "boolean"
      ? settings.notebooksCollapsed
      : DEFAULT_SIDEBAR_SETTINGS.notebooksCollapsed,
  moreCollapsed:
    typeof settings?.moreCollapsed === "boolean"
      ? settings.moreCollapsed
      : DEFAULT_SIDEBAR_SETTINGS.moreCollapsed,
});

export interface PersistedSettings {
  toasts?: Partial<ToastSettings>;
  editor?: Partial<EditorSettings>;
  trash?: Partial<TrashSettings>;
  sidebar?: Partial<SidebarSettings>;
  header?: Partial<HeaderSettings>;
  motion?: unknown;
  language?: unknown;
  appearance?: Partial<AppearanceSettings>;
  export?: Partial<ExportSettings>;
  shortcuts?: unknown;
}

export interface NormalizedSettings {
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
}

/** Coerce a persisted (possibly partial/legacy) settings blob to safe defaults. */
export const normalizePersistedSettings = (
  state: PersistedSettings | undefined,
): NormalizedSettings => ({
  toasts: normalizeToastSettings(state?.toasts),
  editor: normalizeEditorSettings(state?.editor),
  trash: normalizeTrashSettings(state?.trash),
  sidebar: normalizeSidebarSettings(state?.sidebar),
  header: normalizeHeaderSettings(state?.header),
  motion: normalizeMotion(state?.motion),
  language: normalizeLanguage(state?.language),
  appearance: normalizeAppearance(state?.appearance),
  export: normalizeExportSettings(state?.export),
  shortcuts: normalizeShortcuts(state?.shortcuts),
});
