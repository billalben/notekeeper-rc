import type { Note } from "@/shared/types";
import type { MoveDirection, MoveFlags } from "@/shared/lib/notes";

export type NoteWithMoveFlags = Note & MoveFlags;

/** Editable fields of a note as produced by the editor. */
export interface NoteDraft {
  title: string;
  text: string;
  tags: string[];
  notebookId: string;
  favorite: boolean;
}

export type NoteSaveInput = NoteDraft;

/** Shared callbacks threaded through the note list and its cards. */
export interface NoteListHandlers {
  onOpen: (note: Note) => void;
  onTogglePin: (note: Note) => void;
  onToggleFavorite: (note: Note) => void;
  onMove: (note: Note, direction: MoveDirection) => void;
  onRequestMove: (note: Note) => void;
  onRequestDelete: (note: Note) => void;
}
