import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeNote, makeNotebook } from "@tests/factories";
import type { Note } from "@/shared/types";
import { useNoteStore } from "@/shared/stores/useNoteStore";

const get = () => useNoteStore.getState();
const initialState = useNoteStore.getState();

type NoteStoreState = ReturnType<typeof useNoteStore.getState>;

const addNote = (...args: Parameters<NoteStoreState["addNote"]>): Note => {
  const note = get().addNote(...args);
  if (!note) throw new Error("expected addNote to return a note");
  return note;
};

beforeEach(() => {
  useNoteStore.setState(initialState, true);
});

describe("tag registry", () => {
  it("normalizes, dedupes case-insensitively, and sorts tags", () => {
    get().createTag("#Work");
    get().createTag("home");
    get().createTag("WORK");
    get().createTag("   ");
    expect(get().tags).toEqual(["home", "Work"]);
  });

  it("removes a tag from the registry and from every note", () => {
    useNoteStore.setState({
      tags: ["Work", "Home", "other"],
      notebooks: [
        makeNotebook({
          id: "nb",
          notes: [
            makeNote({ id: "n1", tags: ["Work", "Home"] }),
            makeNote({ id: "n2", tags: ["other"] }),
          ],
        }),
      ],
    });

    get().deleteTag("work");

    expect(get().tags).toEqual(["Home", "other"]);
    expect(get().notebooks[0].notes[0].tags).toEqual(["Home"]);
    expect(get().notebooks[0].notes[1].tags).toEqual(["other"]);
  });
});

describe("notebook lifecycle", () => {
  it("adds a notebook, activates it, and defaults empty names", () => {
    const notebook = get().addNotebook("");
    expect(notebook.name).toBe("Untitled");
    expect(notebook.notes).toEqual([]);
    expect(get().activeNotebookId).toBe(notebook.id);
  });

  it("truncates long notebook names on add and rename", () => {
    const notebook = get().addNotebook("a".repeat(150));
    expect(notebook.name).toHaveLength(100);

    get().renameNotebook(notebook.id, "b".repeat(150));
    expect(get().notebooks[0].name).toHaveLength(100);
  });

  it("toggles pinning and restores trashed notebooks", () => {
    const notebook = get().addNotebook("N");

    get().toggleNotebookPin(notebook.id);
    expect(get().notebooks[0].pinned).toBe(true);

    get().deleteNotebook(notebook.id);
    expect(get().notebooks[0].deletedAt).toBeTypeOf("number");
    get().restoreNotebook(notebook.id);
    expect(get().notebooks[0].deletedAt).toBeNull();
  });

  it("activates a neighbour when the active notebook is deleted", () => {
    const a = get().addNotebook("A");
    const b = get().addNotebook("B");
    const c = get().addNotebook("C");

    get().setActiveNotebook(b.id);
    get().deleteNotebook(b.id);
    expect(get().activeNotebookId).toBe(c.id);

    get().deleteNotebook(c.id);
    expect(get().activeNotebookId).toBe(a.id);
  });

  it("falls back to the first notebook when permanently deleting the active one", () => {
    const a = get().addNotebook("A");
    const b = get().addNotebook("B");

    get().setActiveNotebook(b.id);
    get().permanentlyDeleteNotebook(b.id);

    expect(get().notebooks.map((notebook) => notebook.id)).toEqual([a.id]);
    expect(get().activeNotebookId).toBe(a.id);
  });

  it("clears the active notebook when the last one is permanently deleted", () => {
    const only = get().addNotebook("Only");
    get().permanentlyDeleteNotebook(only.id);
    expect(get().activeNotebookId).toBeNull();
  });
});

describe("note lifecycle", () => {
  it("prepends a new note and merges its tags into the registry", () => {
    const notebook = get().addNotebook("N");
    const note = addNote(notebook.id, {
      title: "T",
      text: "hello",
      tags: ["b", "a"],
    });

    expect(get().notebooks[0].notes[0].id).toBe(note.id);
    expect(note.postedOn).toBe(note.updatedOn);
    expect(get().tags).toEqual(["a", "b"]);
  });

  it("stamps updatedOn when a note changes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const notebook = get().addNotebook("N");
    const note = addNote(notebook.id, { title: "T", text: "x" });

    vi.setSystemTime(2000);
    get().updateNote(note.id, { title: "T2", text: "y" });

    const updated = get().notebooks[0].notes[0];
    expect(updated.title).toBe("T2");
    expect(updated.updatedOn).toBe(2000);
  });

  it("toggles pin and favorite flags", () => {
    const notebook = get().addNotebook("N");
    const note = addNote(notebook.id, { title: "T", text: "x" });

    get().toggleNotePin(notebook.id, note.id);
    get().toggleNoteFavorite(notebook.id, note.id);
    expect(get().notebooks[0].notes[0].pinned).toBe(true);
    expect(get().notebooks[0].notes[0].favorite).toBe(true);

    get().setNoteFavorite(note.id, false);
    expect(get().notebooks[0].notes[0].favorite).toBe(false);
  });

  it("moves a note within its pinned group", () => {
    useNoteStore.setState({
      notebooks: [
        makeNotebook({
          id: "nb",
          notes: [
            makeNote({ id: "a" }),
            makeNote({ id: "b" }),
            makeNote({ id: "c" }),
          ],
        }),
      ],
    });

    get().moveNote("nb", "b", "up");

    expect(get().notebooks[0].notes.map((note) => note.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
  });
});

describe("moving notes between notebooks", () => {
  const seed = () =>
    useNoteStore.setState({
      notebooks: [
        makeNotebook({
          id: "src",
          notes: [
            makeNote({ id: "a" }),
            makeNote({ id: "b" }),
            makeNote({ id: "c" }),
          ],
        }),
        makeNotebook({ id: "dst", notes: [makeNote({ id: "x" })] }),
      ],
    });

  it("moves a note to the target's top by default and updates its notebookId", () => {
    seed();
    get().moveNoteToNotebook("src", "b", "dst");

    expect(get().notebooks[0].notes.map((note) => note.id)).toEqual(["a", "c"]);
    const target = get().notebooks[1].notes;
    expect(target.map((note) => note.id)).toEqual(["b", "x"]);
    expect(target[0].notebookId).toBe("dst");
  });

  it("honors and clamps the target index", () => {
    seed();
    get().moveNoteToNotebook("src", "a", "dst", 1);
    expect(get().notebooks[1].notes.map((note) => note.id)).toEqual(["x", "a"]);

    get().moveNoteToNotebook("src", "b", "dst", 99);
    expect(get().notebooks[1].notes.map((note) => note.id)).toEqual([
      "x",
      "a",
      "b",
    ]);
  });

  it("refuses to move within the same notebook or into a trashed target", () => {
    seed();
    useNoteStore.setState({
      notebooks: get().notebooks.map((notebook) =>
        notebook.id === "dst" ? { ...notebook, deletedAt: 1 } : notebook,
      ),
    });

    get().moveNoteToNotebook("src", "a", "src");
    get().moveNoteToNotebook("src", "a", "dst");

    expect(get().notebooks[0].notes.map((note) => note.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});

describe("trash", () => {
  it("soft-deletes and restores a note, and purges on demand", () => {
    const notebook = get().addNotebook("N");
    const note = addNote(notebook.id, { title: "T", text: "x" });

    get().deleteNote(notebook.id, note.id);
    expect(get().notebooks[0].notes[0].deletedAt).toBeTypeOf("number");

    get().restoreNote(note.id);
    expect(get().notebooks[0].notes[0].deletedAt).toBeNull();

    get().deleteNote(notebook.id, note.id);
    get().permanentlyDeleteNote(notebook.id, note.id);
    expect(get().notebooks[0].notes).toEqual([]);
  });

  it("purges only items older than the retention window", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    const notebook = get().addNotebook("N");
    get().addNote(notebook.id, { title: "old", text: "x" });
    get().addNote(notebook.id, { title: "new", text: "y" });
    const [newNote, oldNote] = get().notebooks[0].notes;

    get().deleteNote(notebook.id, oldNote.id);
    vi.setSystemTime(1_100_000);
    get().deleteNote(notebook.id, newNote.id);

    get().purgeExpiredTrash(50_000);

    expect(get().notebooks[0].notes.map((note) => note.id)).toEqual([
      newNote.id,
    ]);
  });

  it("does nothing when retention is forever", () => {
    const notebook = get().addNotebook("N");
    const note = addNote(notebook.id, { title: "T", text: "x" });
    get().deleteNote(notebook.id, note.id);

    get().purgeExpiredTrash(null);
    expect(get().notebooks[0].notes).toHaveLength(1);
  });

  it("empties the trash across notebooks and notes", () => {
    useNoteStore.setState({
      notebooks: [
        makeNotebook({ id: "keep", notes: [makeNote({ id: "n" })] }),
        makeNotebook({ id: "gone", deletedAt: 1 }),
      ],
      activeNotebookId: "gone",
    });

    get().emptyTrash();

    expect(get().notebooks.map((notebook) => notebook.id)).toEqual(["keep"]);
    expect(get().activeNotebookId).toBe("keep");
  });
});

describe("bulk deletion", () => {
  it("deletes all notes but keeps notebooks", () => {
    get().addNotebook("A");
    const notebook = get().notebooks[0];
    get().addNote(notebook.id, { title: "T", text: "x" });

    get().deleteAllNotes();

    expect(get().notebooks).toHaveLength(1);
    expect(get().notebooks[0].notes).toEqual([]);
  });

  it("deletes all notebooks and the active id", () => {
    get().addNotebook("A");
    get().deleteAllNotebooks();
    expect(get().notebooks).toEqual([]);
    expect(get().activeNotebookId).toBeNull();
  });

  it("deletes everything including the tag registry", () => {
    get().createTag("work");
    get().addNotebook("A");
    get().deleteAllData();
    expect(get().notebooks).toEqual([]);
    expect(get().tags).toEqual([]);
    expect(get().activeNotebookId).toBeNull();
  });
});
