import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Note, Notebook } from "../types";
import { generateID, moveWithinGroup, type MoveDirection } from "../utils";
import { createLocalStorage, isQuotaExceededError } from "./persistStorage";
import { toast } from "./useToastStore";

const STORAGE_KEY = "noteKeeperDB";
const STORAGE_VERSION = 4;

const STORAGE_ERROR_COOLDOWN = 10_000;
let lastStorageErrorAt = 0;

const handleStorageError = (error: unknown) => {
  const now = Date.now();
  if (now - lastStorageErrorAt < STORAGE_ERROR_COOLDOWN) return;
  lastStorageErrorAt = now;

  if (isQuotaExceededError(error)) {
    toast.error("Browser storage is full", {
      description:
        "Free up space or export a backup. Recent changes may not be saved.",
    });
    return;
  }

  toast.error("Couldn't save your changes", {
    description: "This browser blocked local storage. Check your settings.",
  });
};

interface NoteStore {
  notebooks: Notebook[];
  activeNotebookId: string | null;
  addNotebook: (name: string) => Notebook;
  renameNotebook: (notebookId: string, name: string) => void;
  toggleNotebookPin: (notebookId: string) => void;
  moveNotebook: (notebookId: string, direction: MoveDirection) => void;
  deleteNotebook: (notebookId: string) => void;
  restoreNotebook: (notebookId: string) => void;
  permanentlyDeleteNotebook: (notebookId: string) => void;
  setActiveNotebook: (notebookId: string | null) => void;
  addNote: (
    notebookId: string,
    data: Pick<Note, "title" | "text">,
  ) => Note | undefined;
  updateNote: (noteId: string, data: Pick<Note, "title" | "text">) => void;
  toggleNotePin: (notebookId: string, noteId: string) => void;
  moveNote: (
    notebookId: string,
    noteId: string,
    direction: MoveDirection,
  ) => void;
  deleteNote: (notebookId: string, noteId: string) => void;
  restoreNote: (noteId: string) => void;
  permanentlyDeleteNote: (notebookId: string, noteId: string) => void;
  emptyTrash: () => void;
  purgeExpiredTrash: (retentionMs: number | null) => void;
  deleteAllNotes: () => void;
  deleteAllNotebooks: () => void;
  deleteAllData: () => void;
}

/**
 * Backfill fields added after a note/notebook was first created:
 * `updatedOn` (v2), `deletedAt` (v3), and `pinned` (v4).
 */
const withDefaults = (notebooks: Notebook[]): Notebook[] =>
  notebooks.map((notebook) => ({
    ...notebook,
    deletedAt: notebook.deletedAt ?? null,
    pinned: notebook.pinned ?? false,
    notes: notebook.notes.map((note) => ({
      ...note,
      updatedOn: note.updatedOn ?? note.postedOn,
      deletedAt: note.deletedAt ?? null,
      pinned: note.pinned ?? false,
    })),
  }));

/**
 * Remove trashed items. With a `cutoff` timestamp, only items deleted at or
 * before it are removed; with `null`, everything in the trash is removed.
 */
const removeExpired = (
  state: { notebooks: Notebook[]; activeNotebookId: string | null },
  cutoff: number | null,
) => {
  const isExpired = (deletedAt: number | null) =>
    deletedAt !== null && (cutoff === null || deletedAt <= cutoff);

  const notebooks = state.notebooks
    .filter((notebook) => !isExpired(notebook.deletedAt))
    .map((notebook) => ({
      ...notebook,
      notes: notebook.notes.filter((note) => !isExpired(note.deletedAt)),
    }));

  const activeNotebookId = notebooks.some(
    (notebook) => notebook.id === state.activeNotebookId,
  )
    ? state.activeNotebookId
    : (notebooks[0]?.id ?? null);

  return { notebooks, activeNotebookId };
};

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
      const notebooks = withDefaults(parsed.notebooks as Notebook[]);
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
    (set) => ({
      notebooks: [],
      activeNotebookId: null,

      addNotebook: (name) => {
        const notebook: Notebook = {
          id: generateID(),
          name: name || "Untitled",
          notes: [],
          deletedAt: null,
          pinned: false,
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

      toggleNotebookPin: (notebookId) => {
        set((state) => ({
          notebooks: state.notebooks.map((notebook) =>
            notebook.id === notebookId
              ? { ...notebook, pinned: !notebook.pinned }
              : notebook,
          ),
        }));
      },

      moveNotebook: (notebookId, direction) => {
        set((state) => ({
          notebooks: moveWithinGroup(state.notebooks, notebookId, direction),
        }));
      },

      deleteNotebook: (notebookId) => {
        const now = new Date().getTime();
        set((state) => {
          const visible = state.notebooks.filter(
            (notebook) => notebook.deletedAt === null,
          );
          const notebooks = state.notebooks.map((notebook) =>
            notebook.id === notebookId ? { ...notebook, deletedAt: now } : notebook,
          );

          let nextActiveId = state.activeNotebookId;
          if (state.activeNotebookId === notebookId) {
            const index = visible.findIndex(
              (notebook) => notebook.id === notebookId,
            );
            const neighbour = visible[index + 1] ?? visible[index - 1] ?? null;
            nextActiveId = neighbour?.id ?? null;
          }

          return { notebooks, activeNotebookId: nextActiveId };
        });
      },

      restoreNotebook: (notebookId) => {
        set((state) => ({
          notebooks: state.notebooks.map((notebook) =>
            notebook.id === notebookId ? { ...notebook, deletedAt: null } : notebook,
          ),
        }));
      },

      permanentlyDeleteNotebook: (notebookId) => {
        set((state) => {
          const notebooks = state.notebooks.filter(
            (notebook) => notebook.id !== notebookId,
          );
          const activeNotebookId =
            state.activeNotebookId === notebookId
              ? (notebooks[0]?.id ?? null)
              : state.activeNotebookId;
          return { notebooks, activeNotebookId };
        });
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
          deletedAt: null,
          pinned: false,
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

      toggleNotePin: (notebookId, noteId) => {
        set((state) => ({
          notebooks: state.notebooks.map((notebook) =>
            notebook.id === notebookId
              ? {
                  ...notebook,
                  notes: notebook.notes.map((note) =>
                    note.id === noteId
                      ? { ...note, pinned: !note.pinned }
                      : note,
                  ),
                }
              : notebook,
          ),
        }));
      },

      moveNote: (notebookId, noteId, direction) => {
        set((state) => ({
          notebooks: state.notebooks.map((notebook) =>
            notebook.id === notebookId
              ? {
                  ...notebook,
                  notes: moveWithinGroup(notebook.notes, noteId, direction),
                }
              : notebook,
          ),
        }));
      },

      deleteNote: (notebookId, noteId) => {
        const now = new Date().getTime();
        set((state) => ({
          notebooks: state.notebooks.map((notebook) =>
            notebook.id === notebookId
              ? {
                  ...notebook,
                  notes: notebook.notes.map((note) =>
                    note.id === noteId ? { ...note, deletedAt: now } : note,
                  ),
                }
              : notebook,
          ),
        }));
      },

      restoreNote: (noteId) => {
        set((state) => ({
          notebooks: state.notebooks.map((notebook) => ({
            ...notebook,
            notes: notebook.notes.map((note) =>
              note.id === noteId ? { ...note, deletedAt: null } : note,
            ),
          })),
        }));
      },

      permanentlyDeleteNote: (notebookId, noteId) => {
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

      emptyTrash: () => {
        set((state) => removeExpired(state, null));
      },

      purgeExpiredTrash: (retentionMs) => {
        if (retentionMs === null) return;
        set((state) => removeExpired(state, Date.now() - retentionMs));
      },

      deleteAllNotes: () => {
        set((state) => ({
          notebooks: state.notebooks.map((notebook) => ({
            ...notebook,
            notes: [],
          })),
        }));
      },

      deleteAllNotebooks: () => set({ notebooks: [], activeNotebookId: null }),
      deleteAllData: () => set({ notebooks: [], activeNotebookId: null }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => createLocalStorage(handleStorageError)),
      migrate: (persistedState) => {
        const state = persistedState as {
          notebooks?: Notebook[];
          activeNotebookId?: string | null;
        };

        return {
          notebooks: withDefaults(state.notebooks ?? []),
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
