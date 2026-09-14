export interface Note {
  id: string;
  notebookId: string;
  title: string;
  text: string;
  postedOn: number;
}

export interface Notebook {
  id: string;
  name: string;
  notes: Note[];
}
