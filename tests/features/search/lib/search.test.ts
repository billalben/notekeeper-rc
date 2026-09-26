import { describe, expect, it } from "vitest";
import { makeNote, makeNotebook } from "@tests/factories";
import {
  collectSearchEntries,
  createNoteSearchIndex,
  runSearch,
} from "@/features/search/lib/search";

const notebooks = [
  makeNotebook({
    name: "Work",
    notes: [
      makeNote({ id: "a", title: "Alpha", text: "the quick brown fox" }),
      makeNote({ id: "b", title: "Beta", text: "lazy dog" }),
      makeNote({
        id: "trashed",
        title: "Alpha two",
        text: "quick",
        deletedAt: 1,
      }),
    ],
  }),
  makeNotebook({
    name: "Hidden",
    deletedAt: 1,
    notes: [makeNote({ id: "hidden", title: "Alpha three", text: "quick" })],
  }),
];

describe("collectSearchEntries", () => {
  it("collects visible notes with their notebook name", () => {
    const entries = collectSearchEntries(notebooks);
    expect(entries.map((entry) => entry.note.id)).toEqual(["a", "b"]);
    expect(entries[0].notebookName).toBe("Work");
  });
});

describe("runSearch", () => {
  const fuse = createNoteSearchIndex(collectSearchEntries(notebooks));

  it("returns nothing for a blank query", () => {
    expect(runSearch(fuse, "")).toEqual([]);
    expect(runSearch(fuse, "   ")).toEqual([]);
  });

  it("finds notes by body text with a snippet around the match", () => {
    const results = runSearch(fuse, "quick");
    expect(results.map((result) => result.note.id)).toEqual(["a"]);
    expect(results[0].snippet).toContain("quick");
    expect(results[0].notebookName).toBe("Work");
  });

  it("finds notes by title and reports the matched title ranges", () => {
    const results = runSearch(fuse, "Beta");
    expect(results.map((result) => result.note.id)).toEqual(["b"]);
    expect(results[0].snippet.length).toBeGreaterThan(0);
  });

  it("never surfaces trashed notes or notes in trashed notebooks", () => {
    const ids = runSearch(fuse, "quick").map((result) => result.note.id);
    expect(ids).not.toContain("trashed");
    expect(ids).not.toContain("hidden");
  });

  it("honors the result limit", () => {
    const many = Array.from({ length: 10 }, (_, index) =>
      makeNote({ id: `n${index}`, title: "Widget", text: "widget widget" }),
    );
    const bigFuse = createNoteSearchIndex(
      collectSearchEntries([makeNotebook({ name: "Many", notes: many })]),
    );
    expect(runSearch(bigFuse, "widget", 3)).toHaveLength(3);
  });
});
