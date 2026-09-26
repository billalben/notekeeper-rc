import type { Note, Notebook } from "@/shared/types";

let sequence = 0;

const nextId = (prefix: string): string => {
  sequence += 1;
  return `${prefix}-${sequence}`;
};

export const makeNote = (overrides: Partial<Note> = {}): Note => ({
  id: nextId("note"),
  notebookId: "notebook-1",
  title: "Note",
  text: "",
  tags: [],
  postedOn: 0,
  updatedOn: 0,
  deletedAt: null,
  pinned: false,
  favorite: false,
  ...overrides,
});

export const makeNotebook = (overrides: Partial<Notebook> = {}): Notebook => ({
  id: nextId("notebook"),
  name: "Notebook",
  notes: [],
  deletedAt: null,
  pinned: false,
  ...overrides,
});
