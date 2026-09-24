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
