export interface Note {
  id: string;
  notebookId: string;
  title: string;
  text: string;
  postedOn: number;
  updatedOn: number;
  deletedAt: number | null;
  archivedAt: number | null;
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

/** A bounded snapshot of a note's content taken before an edit was saved. */
export interface NoteRevision {
  id: string;
  noteId: string;
  title: string;
  text: string;
  tags: string[];
  createdAt: number;
}
