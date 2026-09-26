import { describe, expect, it } from "vitest";
import { makeNote, makeNotebook } from "@tests/factories";
import type { Note, Notebook } from "@/shared/types";
import {
  collectAllNotes,
  collectFavoriteNotes,
  collectPinnedNotes,
  collectRecentNotes,
  countTagUsageMap,
  filterNotesByTags,
  moveWithinGroup,
  sortByPinned,
  withMoveFlags,
} from "@/shared/lib/notes";

describe("sortByPinned", () => {
  it("places pinned items first without mutating the input", () => {
    const items = [
      { id: "a", pinned: false },
      { id: "b", pinned: true },
      { id: "c", pinned: false },
    ];
    expect(sortByPinned(items).map((item) => item.id)).toEqual(["b", "a", "c"]);
    expect(items.map((item) => item.id)).toEqual(["a", "b", "c"]);
  });
});

describe("countTagUsageMap", () => {
  it("counts tags case-insensitively across all notes, including trashed", () => {
    const notebooks = [
      makeNotebook({
        notes: [
          makeNote({ tags: ["Work", "home"] }),
          makeNote({ deletedAt: 1, tags: ["work"] }),
        ],
      }),
    ];

    expect(countTagUsageMap(notebooks)).toEqual({ work: 2, home: 1 });
  });
});

describe("filterNotesByTags", () => {
  const notebooks = [
    makeNotebook({
      notes: [
        makeNote({ id: "a", tags: ["work", "urgent"] }),
        makeNote({ id: "b", tags: ["work"] }),
        makeNote({ id: "c", deletedAt: 1, tags: ["work", "urgent"] }),
      ],
    }),
    makeNotebook({
      deletedAt: 1,
      notes: [makeNote({ id: "d", tags: ["work", "urgent"] })],
    }),
  ];

  it("matches notes carrying every tag, case-insensitively", () => {
    expect(
      filterNotesByTags(notebooks, ["WORK"]).map((note) => note.id),
    ).toEqual(["a", "b"]);
    expect(
      filterNotesByTags(notebooks, ["work", "URGENT"]).map((note) => note.id),
    ).toEqual(["a"]);
  });

  it("returns nothing for an empty tag list", () => {
    expect(filterNotesByTags(notebooks, [])).toEqual([]);
  });
});

const notebooksForCollection = (): Notebook[] => [
  makeNotebook({
    notes: [
      makeNote({ id: "old-fav", favorite: true, updatedOn: 10 }),
      makeNote({ id: "new-fav", favorite: true, updatedOn: 30 }),
      makeNote({ id: "pinned", pinned: true, updatedOn: 20 }),
      makeNote({ id: "plain", updatedOn: 40 }),
      makeNote({ id: "trashed", favorite: true, updatedOn: 99, deletedAt: 1 }),
    ],
  }),
  makeNotebook({
    deletedAt: 1,
    notes: [makeNote({ id: "hidden-fav", favorite: true, updatedOn: 100 })],
  }),
];

describe("collectFavoriteNotes", () => {
  it("returns visible favorites newest first, ignoring trashed items", () => {
    expect(
      collectFavoriteNotes(notebooksForCollection()).map((note) => note.id),
    ).toEqual(["new-fav", "old-fav"]);
  });
});

describe("collectPinnedNotes", () => {
  it("returns visible pinned notes newest first", () => {
    expect(
      collectPinnedNotes(notebooksForCollection()).map((note) => note.id),
    ).toEqual(["pinned"]);
  });
});

describe("collectAllNotes", () => {
  it("orders pinned first, then by most recently updated", () => {
    expect(
      collectAllNotes(notebooksForCollection()).map((note) => note.id),
    ).toEqual(["pinned", "plain", "new-fav", "old-fav"]);
  });
});

describe("collectRecentNotes", () => {
  it("orders by recency and respects the limit", () => {
    const notes = collectRecentNotes(notebooksForCollection(), 2);
    expect(notes.map((note) => note.id)).toEqual(["plain", "new-fav"]);
  });
});

const movable = (
  id: string,
  pinned: boolean,
  deletedAt: number | null = null,
) =>
  ({ id, pinned, deletedAt }) satisfies {
    id: string;
    pinned: boolean;
    deletedAt: number | null;
  };

describe("moveWithinGroup", () => {
  it("swaps with the nearest same-group neighbour", () => {
    const items = [
      movable("a", false),
      movable("b", false),
      movable("c", false),
    ];
    expect(moveWithinGroup(items, "b", "up").map((item) => item.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
    expect(moveWithinGroup(items, "b", "down").map((item) => item.id)).toEqual([
      "a",
      "c",
      "b",
    ]);
  });

  it("never crosses the pinned boundary", () => {
    const items = [
      movable("p", true),
      movable("u1", false),
      movable("u2", false),
    ];
    expect(moveWithinGroup(items, "u1", "up")).toBe(items);
  });

  it("skips trashed neighbours", () => {
    const items = [
      movable("a", false),
      movable("b", false, 5),
      movable("c", false),
    ];
    expect(moveWithinGroup(items, "a", "down").map((item) => item.id)).toEqual([
      "c",
      "b",
      "a",
    ]);
  });

  it("returns the original array when no move is possible", () => {
    const items = [movable("a", false), movable("b", false)];
    expect(moveWithinGroup(items, "a", "up")).toBe(items);
    expect(moveWithinGroup(items, "b", "down")).toBe(items);
    expect(moveWithinGroup(items, "missing", "up")).toBe(items);
  });
});

describe("withMoveFlags", () => {
  it("flags neighbours within the same pinned group", () => {
    const items = [
      movable("a", false),
      movable("b", false),
      movable("c", false),
    ];
    expect(withMoveFlags(items)).toEqual([
      { ...items[0], canMoveUp: false, canMoveDown: true },
      { ...items[1], canMoveUp: true, canMoveDown: true },
      { ...items[2], canMoveUp: true, canMoveDown: false },
    ]);
  });

  it("does not count a different group or a trashed neighbour", () => {
    const pinned = movable("p", true);
    const unpinned = movable("u", false);
    const trashed = movable("t", false, 1);
    const flags = withMoveFlags([pinned, unpinned, trashed]);
    expect(flags[0].canMoveDown).toBe(false);
    expect(flags[1].canMoveUp).toBe(false);
    expect(flags[1].canMoveDown).toBe(false);
  });
});

describe("collection helpers ignore trashed notebooks and notes", () => {
  it("excludes a note in a trashed notebook from every collection", () => {
    const notebooks: Notebook[] = notebooksForCollection();
    const ids = [
      ...collectAllNotes(notebooks),
      ...collectFavoriteNotes(notebooks),
      ...collectPinnedNotes(notebooks),
      ...collectRecentNotes(notebooks),
    ].map((note: Note) => note.id);
    expect(ids).not.toContain("hidden-fav");
    expect(ids).not.toContain("trashed");
  });
});
