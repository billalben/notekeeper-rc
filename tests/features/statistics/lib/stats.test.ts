import { describe, expect, it } from "vitest";
import { makeNote, makeNotebook } from "@tests/factories";
import { DAY_MS } from "@/shared/lib/constants";
import { computeLibraryStats } from "@/features/statistics/lib/stats";

const NOW = new Date(2026, 0, 15, 12, 0, 0).getTime();
const DAY_START = new Date(NOW).setHours(0, 0, 0, 0);

const buildLibrary = () => {
  const n1 = makeNote({
    id: "n1",
    title: "n1",
    text: "one two three",
    postedOn: DAY_START + 1000,
    updatedOn: DAY_START + 1000,
    favorite: true,
  });
  const n2 = makeNote({
    id: "n2",
    title: "n2",
    text: "four five",
    postedOn: DAY_START - DAY_MS + 1000,
    updatedOn: DAY_START + 2000,
    pinned: true,
  });
  const n3 = makeNote({
    id: "n3",
    title: "n3",
    text: "",
    postedOn: DAY_START - 5 * DAY_MS + 1000,
    updatedOn: DAY_START - 5 * DAY_MS + 5000,
  });
  const trashedNote = makeNote({
    id: "n4",
    text: "ignored",
    postedOn: DAY_START + 1000,
    updatedOn: DAY_START + 1000,
    deletedAt: DAY_START + 3000,
  });

  const work = makeNotebook({
    id: "work",
    name: "Work",
    notes: [n1, n2, trashedNote],
  });
  const home = makeNotebook({ id: "home", name: "Home", notes: [n3] });
  const empty = makeNotebook({ id: "empty", name: "Empty", notes: [] });
  const archived = makeNotebook({
    id: "archived",
    name: "Archived",
    notes: [makeNote({ id: "n5", postedOn: DAY_START })],
    deletedAt: 1,
  });

  return { notebooks: [work, home, empty, archived], activeNotebookId: "work" };
};

describe("computeLibraryStats", () => {
  it("returns an empty, zeroed report for a fresh library", () => {
    const stats = computeLibraryStats({
      notebooks: [],
      activeNotebookId: null,
      now: NOW,
    });

    expect(stats).toMatchObject({
      notebookCount: 0,
      noteCount: 0,
      activeNotebookNoteCount: 0,
      totalWords: 0,
      totalChars: 0,
      wordsPerNote: 0,
      pinnedCount: 0,
      favoriteCount: 0,
      weekCreated: 0,
      weekEdited: 0,
      notebookStats: [],
      emptyNotebooks: [],
      lastUpdated: null,
      lastCreated: null,
    });
    expect(stats.weekActivity).toHaveLength(7);
    expect(stats.weekActivity.every((day) => day.created === 0)).toBe(true);
  });

  it("aggregates counts, words, and flags from visible notes only", () => {
    const stats = computeLibraryStats({ ...buildLibrary(), now: NOW });

    expect(stats.notebookCount).toBe(3);
    expect(stats.noteCount).toBe(3);
    expect(stats.activeNotebookNoteCount).toBe(2);
    expect(stats.totalWords).toBe(5);
    expect(stats.totalChars).toBe(22);
    expect(stats.wordsPerNote).toBeCloseTo(5 / 3);
    expect(stats.pinnedCount).toBe(1);
    expect(stats.favoriteCount).toBe(1);
  });

  it("ranks notebooks by note count and lists empty ones", () => {
    const stats = computeLibraryStats({ ...buildLibrary(), now: NOW });

    expect(stats.notebookStats).toEqual([
      { id: "work", name: "Work", count: 2 },
      { id: "home", name: "Home", count: 1 },
    ]);
    expect(stats.emptyNotebooks).toEqual(["Empty"]);
  });

  it("buckets the last seven days oldest-first with today last", () => {
    const stats = computeLibraryStats({ ...buildLibrary(), now: NOW });

    expect(stats.weekCreated).toBe(3);
    expect(stats.weekEdited).toBe(2);
    expect(stats.weekActivity[1]).toMatchObject({
      date: DAY_START - 5 * DAY_MS,
      created: 1,
      edited: 1,
      isToday: false,
    });
    expect(stats.weekActivity[5].created).toBe(1);
    expect(stats.weekActivity[6]).toMatchObject({
      date: DAY_START,
      created: 1,
      edited: 1,
      isToday: true,
    });
  });

  it("tracks the most recently created and updated notes", () => {
    const stats = computeLibraryStats({ ...buildLibrary(), now: NOW });

    expect(stats.lastUpdated?.id).toBe("n2");
    expect(stats.lastCreated?.id).toBe("n1");
  });

  it("ignores an active notebook that is not visible", () => {
    const stats = computeLibraryStats({
      ...buildLibrary(),
      activeNotebookId: "archived",
      now: NOW,
    });
    expect(stats.activeNotebookNoteCount).toBe(0);
  });
});
