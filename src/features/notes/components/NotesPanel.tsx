import { NoteList } from "./NoteList";
import type { NoteListHandlers, NoteWithMoveFlags } from "../types";

interface NotesPanelProps extends NoteListHandlers {
  title: string;
  notes: NoteWithMoveFlags[];
  canMoveToNotebook: boolean;
  notebookNames?: Record<string, string>;
  emptyMessage?: string;
  emptyIcon?: string;
  selectedNoteId?: string | null;
}

/** Panel heading plus the note list, shared by the All/Pinned/Favorites/Recent views. */
export const NotesPanel = ({ title, ...listProps }: NotesPanelProps) => (
  <>
    <h2 className="title text-title-medium" data-note-panel-title>
      {title}
    </h2>
    <NoteList {...listProps} />
  </>
);
