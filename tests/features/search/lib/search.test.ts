import { describe, expect, it } from "vitest";
import { makeNote, makeNotebook } from "@tests/factories";
import {
  collectSearchEntries,
  createNoteSearchIndex,
  runSearch,
} from "@/features/search/lib/search";

const notebooks = [
  makeNotebook({
    id: "work",
    name: "Work",
    notes: [
      makeNote({
        id: "a",
        title: "Alpha",
        text: "the quick brown fox",
        tags: ["project", "work"],
        updatedOn: 10,
      }),
      makeNote({
        id: "b",
        title: "Beta",
        text: "lazy dog",
        tags: ["personal"],
        updatedOn: 20,
      }),
      makeNote({
        id: "trashed",
        title: "Alpha two",
        text: "quick",
        deletedAt: 1,
      }),
      makeNote({
        id: "archived",
        title: "Alpha archived",
        text: "quick",
        archivedAt: 1,
      }),
    ],
  }),
  makeNotebook({
    id: "journal",
    name: "Journal",
    notes: [
      makeNote({
        id: "j",
        title: "Entry",
        text: "today",
        tags: ["daily"],
        updatedOn: new Date(2025, 11, 31).getTime(),
      }),
      makeNote({
        id: "pinned",
        title: "Pinned",
        text: "needle",
        tags: ["work"],
        pinned: true,
        updatedOn: 30,
      }),
      makeNote({
        id: "favorite",
        title: "Favorite",
        text: "needle",
        tags: ["personal"],
        favorite: true,
        updatedOn: 40,
      }),
      makeNote({
        id: "future",
        title: "Future",
        text: "tomorrow",
        tags: ["daily"],
        updatedOn: new Date(2026, 5, 1).getTime(),
      }),
    ],
  }),
  makeNotebook({
    id: "hidden",
    name: "Hidden",
    deletedAt: 1,
    notes: [makeNote({ id: "hidden", title: "Alpha three", text: "quick" })],
  }),
];

describe("collectSearchEntries", () => {
  it("collects visible notes with their notebook id and name", () => {
    const entries = collectSearchEntries(notebooks);

    expect(entries.map((entry) => entry.note.id)).toEqual([
      "a",
      "b",
      "j",
      "pinned",
      "favorite",
      "future",
    ]);
    expect(entries[0]).toMatchObject({
      notebookId: "work",
      notebookName: "Work",
    });
  });
});

describe("runSearch", () => {
  const index = createNoteSearchIndex(collectSearchEntries(notebooks));

  it("returns nothing for a blank query", () => {
    expect(runSearch(index, "")).toEqual([]);
    expect(runSearch(index, "   ")).toEqual([]);
  });

  it("finds notes by body text with a snippet around the match", () => {
    const results = runSearch(index, "quick");

    expect(results.map((result) => result.note.id)).toEqual(["a"]);
    expect(results[0].snippet).toContain("quick");
    expect(results[0].notebookName).toBe("Work");
  });

  it("finds notes by title and reports the matched title ranges", () => {
    const results = runSearch(index, "Beta");

    expect(results.map((result) => result.note.id)).toEqual(["b"]);
    expect(results[0].snippet.length).toBeGreaterThan(0);
  });

  it("never surfaces trashed or archived notes, or notes in trashed notebooks", () => {
    const ids = runSearch(index, "quick").map((result) => result.note.id);

    expect(ids).not.toContain("trashed");
    expect(ids).not.toContain("archived");
    expect(ids).not.toContain("hidden");
  });

  it("honors the result limit", () => {
    const many = Array.from({ length: 10 }, (_, index) =>
      makeNote({ id: `n${index}`, title: "Widget", text: "widget widget" }),
    );
    const bigIndex = createNoteSearchIndex(
      collectSearchEntries([makeNotebook({ name: "Many", notes: many })]),
    );

    expect(runSearch(bigIndex, "widget", 3)).toHaveLength(3);
  });

  it("finds notes by tag and reports the matched tag ranges", () => {
    const results = runSearch(index, "project");

    expect(results.map((result) => result.note.id)).toEqual(["a"]);
    expect(results[0].tagMatches).toEqual([
      { tag: "project", ranges: [[0, 6]] },
    ]);
  });

  it("supports filter-only queries ordered by recency", () => {
    expect(
      runSearch(index, "tag:work").map((result) => result.note.id),
    ).toEqual(["pinned", "a"]);
    expect(
      runSearch(index, "is:pinned").map((result) => result.note.id),
    ).toEqual(["pinned"]);
    expect(
      runSearch(index, "is:favorite").map((result) => result.note.id),
    ).toEqual(["favorite"]);
  });

  it("requires every tag filter", () => {
    expect(
      runSearch(index, "tag:work tag:project").map((result) => result.note.id),
    ).toEqual(["a"]);
    expect(runSearch(index, "tag:work tag:personal")).toEqual([]);
  });

  it("filters by notebook name", () => {
    const ids = runSearch(index, "notebook:journal").map(
      (result) => result.note.id,
    );

    expect(ids).toHaveLength(4);
    expect(ids).toEqual(
      expect.arrayContaining(["j", "pinned", "favorite", "future"]),
    );
  });

  it("filters by last-updated date", () => {
    expect(
      runSearch(index, "after:2026-01-01").map((result) => result.note.id),
    ).toEqual(["future"]);
    expect(
      runSearch(index, "before:2025-12-31").map((result) => result.note.id),
    ).not.toContain("j");
    expect(
      runSearch(index, "before:2026-01-01").map((result) => result.note.id),
    ).not.toContain("future");
  });

  it("combines free text with filters", () => {
    expect(
      runSearch(index, "quick tag:work").map((result) => result.note.id),
    ).toEqual(["a"]);
    expect(runSearch(index, "quick tag:personal")).toEqual([]);
  });

  it("applies the limit after filtering", () => {
    const many = Array.from({ length: 10 }, (_, index) =>
      makeNote({
        id: `n${index}`,
        title: "Widget",
        text: "widget widget",
        tags: ["target"],
      }),
    );
    const bigIndex = createNoteSearchIndex(
      collectSearchEntries([makeNotebook({ name: "Many", notes: many })]),
    );

    expect(runSearch(bigIndex, "widget tag:target", 3)).toHaveLength(3);
  });
});
