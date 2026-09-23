export interface Note {
  id: string;
  notebookId: string;
  title: string;
  text: string;
  postedOn: number;
  updatedOn: number;
  deletedAt: number | null;
  pinned: boolean;
  favorite: boolean;
  tags: string[];
}

export interface Notebook {
  id: string;
  name: string;
  notes: Note[];
  deletedAt: number | null;
  pinned: boolean;
}

export type SettingsSection =
  "general" | "appearance" | "shortcuts" | "notifications" | "data" | "about";

export type ToastType = "success" | "error" | "info";

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";
