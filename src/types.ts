export interface Note {
  id: string;
  notebookId: string;
  title: string;
  text: string;
  postedOn: number;
  updatedOn: number;
  deletedAt: number | null;
}

export interface Notebook {
  id: string;
  name: string;
  notes: Note[];
  deletedAt: number | null;
}

export type ToastType = "success" | "error" | "info";

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";
