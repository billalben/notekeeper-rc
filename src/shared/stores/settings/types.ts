import type { ToastPosition } from "@/shared/types";
import type { TrashRetentionDays } from "@/shared/lib/constants";

export interface ToastSettings {
  enabled: boolean;
  position: ToastPosition;
  duration: number;
  maxVisible: number;
  showCloseButton: boolean;
}

export type EditorMode = "edit" | "preview";

export type EditorPresentation = "modal" | "full" | "split";

export interface EditorSettings {
  autosave: boolean;
  defaultMode: EditorMode;
  presentation: EditorPresentation;
  splitWidth: number;
  showWordCount: boolean;
  closeModalOnBackdropClick: boolean;
}

export interface TrashSettings {
  retentionDays: TrashRetentionDays;
}

export type ExportFormat = "md" | "json";

export interface ExportSettings {
  defaultFormat: ExportFormat;
}

export type MotionPreference = "system" | "reduce" | "full";

export type AccentPreset = "orange" | "blue" | "green";

export type AccentColor = AccentPreset | "custom";

export type FontScale = "small" | "default" | "large";

export type Density = "compact" | "default" | "comfortable";

export type RadiusStyle = "default" | "square" | "rounded";

export interface AppearanceSettings {
  accent: AccentColor;
  accentCustom: string;
  fontScale: FontScale;
  density: Density;
  radius: RadiusStyle;
  highContrast: boolean;
}

export interface SidebarSettings {
  width: number;
  notebooksCollapsed: boolean;
  moreCollapsed: boolean;
}

export interface HeaderSettings {
  showSearch: boolean;
  showShortcuts: boolean;
  showTheme: boolean;
}
