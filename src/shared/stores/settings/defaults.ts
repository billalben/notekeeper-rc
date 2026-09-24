import { TRASH_RETENTION_DAYS } from "@/shared/lib/constants";
import type {
  AppearanceSettings,
  EditorSettings,
  EditorMode,
  EditorPresentation,
  ExportFormat,
  ExportSettings,
  HeaderSettings,
  MotionPreference,
  SidebarSettings,
  ToastSettings,
  TrashSettings,
} from "./types";

export const TOAST_DURATION_MIN = 1000;
export const TOAST_DURATION_MAX = 6000;
export const TOAST_MAX_VISIBLE_MIN = 1;
export const TOAST_MAX_VISIBLE_MAX = 5;

export const DEFAULT_TOAST_SETTINGS: ToastSettings = {
  enabled: true,
  position: "bottom-center",
  duration: 4000,
  maxVisible: 3,
  showCloseButton: true,
};

export const SPLIT_WIDTH_MIN = 320;
export const SPLIT_WIDTH_MAX = 800;
const SPLIT_WIDTH_DEFAULT = 480;

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  autosave: true,
  defaultMode: "preview",
  presentation: "modal",
  splitWidth: SPLIT_WIDTH_DEFAULT,
  showWordCount: true,
  closeModalOnBackdropClick: false,
};

export const DEFAULT_TRASH_SETTINGS: TrashSettings = {
  retentionDays: TRASH_RETENTION_DAYS,
};

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  defaultFormat: "json",
};

export const EXPORT_FORMATS: ExportFormat[] = ["md", "json"];

export const SIDEBAR_WIDTH_MIN = 280;
export const SIDEBAR_WIDTH_MAX = 480;
const SIDEBAR_WIDTH_DEFAULT = 360;

export const DEFAULT_SIDEBAR_SETTINGS: SidebarSettings = {
  width: SIDEBAR_WIDTH_DEFAULT,
  notebooksCollapsed: false,
  moreCollapsed: false,
};

export const DEFAULT_HEADER_SETTINGS: HeaderSettings = {
  showSearch: true,
  showShortcuts: true,
  showTheme: true,
};

export const DEFAULT_MOTION: MotionPreference = "system";

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  accent: "orange",
  fontScale: "default",
  density: "default",
  radius: "default",
  highContrast: false,
};

export const EDITOR_MODES: EditorMode[] = ["edit", "preview"];
export const EDITOR_PRESENTATIONS: EditorPresentation[] = [
  "modal",
  "full",
  "split",
];

export const ACCENT_COLORS: AppearanceSettings["accent"][] = [
  "orange",
  "blue",
  "green",
  "teal",
  "violet",
  "rose",
];

export const FONT_SCALES: AppearanceSettings["fontScale"][] = [
  "small",
  "default",
  "large",
];

export const DENSITIES: AppearanceSettings["density"][] = [
  "compact",
  "default",
  "comfortable",
];

export const RADIUS_STYLES: AppearanceSettings["radius"][] = [
  "default",
  "square",
  "rounded",
];
