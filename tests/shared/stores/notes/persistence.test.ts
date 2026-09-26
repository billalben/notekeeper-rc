import { describe, expect, it } from "vitest";
import type { Notebook } from "@/shared/types";
import { makeNote, makeNotebook } from "@tests/factories";
import {
  STORAGE_KEY,
  STORAGE_VERSION,
  migrateLegacyStorage,
  removeExpired,
  withDefaults,
} from "@/shared/stores/notes/persistence";

describe("withDefaults", () => {
  it("backfills fields added after a note or notebook was created", () => {
    const legacy = [
      {
        id: "nb1",
        name: "Legacy",
        notes: [{ id: "n1", title: "T", text: "x", postedOn: 100 }],
      },
    ] as unknown as Notebook[];

    const [notebook] = withDefaults(legacy);

    expect(notebook).toMatchObject({ deletedAt: null, pinned: false });
    expect(notebook.notes[0]).toMatchObject({
      updatedOn: 100,
      deletedAt: null,
      pinned: false,
      favorite: false,
      tags: [],
    });
  });

  it("preserves existing values and coerces a non-array tags field", () => {
    const notebooks = [
      makeNotebook({
        id: "nb1",
        pinned: true,
        deletedAt: 5,
        notes: [
          makeNote({
            updatedOn: 50,
            favorite: true,
            tags: null as unknown as string[],
          }),
        ],
      }),
    ];

    const [notebook] = withDefaults(notebooks);

    expect(notebook.pinned).toBe(true);
    expect(notebook.deletedAt).toBe(5);
    expect(notebook.notes[0].updatedOn).toBe(50);
    expect(notebook.notes[0].favorite).toBe(true);
    expect(notebook.notes[0].tags).toEqual([]);
  });
});

describe("removeExpired", () => {
  it("removes everything in the trash when the cutoff is null", () => {
    const state = {
      notebooks: [
        makeNotebook({ id: "keep" }),
        makeNotebook({ id: "drop", deletedAt: 100 }),
      ],
      activeNotebookId: "keep",
    };

    const result = removeExpired(state, null);

    expect(result.notebooks.map((notebook) => notebook.id)).toEqual(["keep"]);
    expect(result.activeNotebookId).toBe("keep");
  });

  it("removes only items deleted at or before the cutoff", () => {
    const state = {
      notebooks: [
        makeNotebook({
          id: "nbA",
          notes: [makeNote({ id: "n-old", deletedAt: 100 })],
        }),
        makeNotebook({ id: "nbB", deletedAt: 100 }),
        makeNotebook({ id: "nbC", deletedAt: 500 }),
      ],
      activeNotebookId: "nbB",
    };

    const result = removeExpired(state, 200);

    expect(result.notebooks.map((notebook) => notebook.id)).toEqual([
      "nbA",
      "nbC",
    ]);
    expect(result.notebooks[0].notes).toEqual([]);
    expect(result.activeNotebookId).toBe("nbA");
  });

  it("clears the active id when nothing survives", () => {
    const state = {
      notebooks: [makeNotebook({ id: "gone", deletedAt: 1 })],
      activeNotebookId: "gone",
    };

    expect(removeExpired(state, null)).toEqual({
      notebooks: [],
      activeNotebookId: null,
    });
  });
});

describe("migrateLegacyStorage", () => {
  it("converts the legacy { notebooks } shape into the persisted shape", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        notebooks: [
          {
            id: "nb1",
            name: "Legacy",
            notes: [{ id: "n1", postedOn: 1, tags: ["Work"] }],
          },
        ],
      }),
    );

    migrateLegacyStorage();

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    expect(stored.version).toBe(STORAGE_VERSION);
    expect(stored.state.notebooks[0]).toMatchObject({
      deletedAt: null,
      pinned: false,
    });
    expect(stored.state.tags).toEqual(["Work"]);
    expect(stored.state.activeNotebookId).toBe("nb1");
  });

  it("leaves an already-migrated payload untouched", () => {
    const payload = JSON.stringify({
      state: { notebooks: [], tags: [], activeNotebookId: null },
      version: STORAGE_VERSION,
    });
    localStorage.setItem(STORAGE_KEY, payload);

    migrateLegacyStorage();

    expect(localStorage.getItem(STORAGE_KEY)).toBe(payload);
  });

  it("ignores missing or malformed storage", () => {
    expect(() => migrateLegacyStorage()).not.toThrow();

    localStorage.setItem(STORAGE_KEY, "{ not json");
    expect(() => migrateLegacyStorage()).not.toThrow();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("{ not json");
  });
});
