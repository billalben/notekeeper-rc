import type { SettingsSection } from "@/shared/types";

export type BaseView =
  "all" | "recent" | "pinned" | "favorites" | "stats" | "trash" | "notebook";

export type Overlay =
  | { kind: "settings"; section: SettingsSection }
  | { kind: "search" }
  | { kind: "shortcuts" }
  | null;

export interface Route {
  base: BaseView;
  notebookId: string | null;
  noteId: string | null;
  overlay: Overlay;
}

export const DEFAULT_ROUTE: Route = {
  base: "all",
  notebookId: null,
  noteId: null,
  overlay: null,
};
