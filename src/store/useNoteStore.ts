import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Note, Notebook } from "../types";
import { generateID } from "../utils";

const STORAGE_KEY = "noteKeeperDB";
const STORAGE_VERSION = 2;

interface NoteStore {
  notebooks: Notebook[];
  activeNotebookId: string | null;
  addNotebook: (name: string) => Notebook;
  renameNotebook: (notebookId: string, name: string) => void;
  deleteNotebook: (notebookId: string) => void;
  setActiveNotebook: (notebookId: string | null) => void;
  addNote: (
    notebookId: string,
    data: Pick<Note, "title" | "text">,
  ) => Note | undefined;
  updateNote: (noteId: string, data: Pick<Note, "title" | "text">) => void;
  deleteNote: (notebookId: string, noteId: string) => void;
}

/**
 * Notes created before version 2 only had `postedOn` (the creation time).
 * Backfill `updatedOn` so older notes keep working.
 */
const withUpdatedOn = (notebooks: Notebook[]): Notebook[] =>
  notebooks.map((notebook) => ({
    ...notebook,
    notes: notebook.notes.map((note) => ({
      ...note,
      updatedOn: note.updatedOn ?? note.postedOn,
    })),
  }));

/**
 * The legacy app stored `{ notebooks: [...] }` directly under `noteKeeperDB`.
 * Zustand's persist middleware expects `{ state, version }`, so convert the
 * old shape once on startup to keep existing notes.
 */
const migrateLegacyStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.notebooks) && !("state" in parsed)) {
      const notebooks = withUpdatedOn(parsed.notebooks as Notebook[]);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          state: {
            notebooks,
            activeNotebookId: notebooks[0]?.id ?? null,
          },
          version: STORAGE_VERSION,
        }),
      );
    }
  } catch {
    /* ignore malformed storage */
  }
};

migrateLegacyStorage();

export const useNoteStore = create<NoteStore>()(
  persist(
    (set, get) => ({
      notebooks: [],
      activeNotebookId: null,

      addNotebook: (name) => {
        const notebook: Notebook = {
          id: generateID(),
          name: name || "Untitled",
          notes: [],
        };

        set((state) => ({
          notebooks: [...state.notebooks, notebook],
          activeNotebookId: notebook.id,
        }));

        return notebook;
      },

      renameNotebook: (notebookId, name) => {
        set((state) => ({
          notebooks: state.notebooks.map((notebook) =>
            notebook.id === notebookId ? { ...notebook, name } : notebook,
          ),
        }));
      },

      deleteNotebook: (notebookId) => {
        const { notebooks, activeNotebookId } = get();
        const index = notebooks.findIndex(
          (notebook) => notebook.id === notebookId,
        );

        const remaining = notebooks.filter(
          (notebook) => notebook.id !== notebookId,
        );

        let nextActiveId = activeNotebookId;
        if (activeNotebookId === notebookId) {
          const neighbour =
            notebooks[index + 1] ?? notebooks[index - 1] ?? null;
          nextActiveId = neighbour?.id ?? null;
        }

        set({ notebooks: remaining, activeNotebookId: nextActiveId });
      },

      setActiveNotebook: (notebookId) => set({ activeNotebookId: notebookId }),

      addNote: (notebookId, data) => {
        const now = new Date().getTime();
        const note: Note = {
          id: generateID(),
          notebookId,
          ...data,
          postedOn: now,
          updatedOn: now,
        };

        set((state) => ({
          notebooks: state.notebooks.map((notebook) =>
            notebook.id === notebookId
              ? { ...notebook, notes: [note, ...notebook.notes] }
              : notebook,
          ),
        }));

        return note;
      },

      updateNote: (noteId, data) => {
        set((state) => ({
          notebooks: state.notebooks.map((notebook) => ({
            ...notebook,
            notes: notebook.notes.map((note) =>
              note.id === noteId
                ? { ...note, ...data, updatedOn: new Date().getTime() }
                : note,
            ),
          })),
        }));
      },

      deleteNote: (notebookId, noteId) => {
        set((state) => ({
          notebooks: state.notebooks.map((notebook) =>
            notebook.id === notebookId
              ? {
                  ...notebook,
                  notes: notebook.notes.filter((note) => note.id !== noteId),
                }
              : notebook,
          ),
        }));
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      migrate: (persistedState) => {
        const state = persistedState as {
          notebooks?: Notebook[];
          activeNotebookId?: string | null;
        };

        return {
          notebooks: withUpdatedOn(state.notebooks ?? []),
          activeNotebookId: state.activeNotebookId ?? null,
        };
      },
      partialize: (state) => ({
        notebooks: state.notebooks,
        activeNotebookId: state.activeNotebookId,
      }),
    },
  ),
);
