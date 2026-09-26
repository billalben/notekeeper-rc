import { describe, expect, it } from "vitest";
import { makeNote, makeNotebook } from "@tests/factories";
import { computeSidebarCounts } from "@/features/notebooks/lib/sidebarCounts";

describe("computeSidebarCounts", () => {
  it("counts visible, trashed, favorite, and pinned items", () => {
    const notebooks = [
      makeNotebook({
        id: "pinned-nb",
        pinned: true,
        notes: [
          makeNote({ favorite: true }),
          makeNote({ pinned: true }),
          makeNote({ deletedAt: 1 }),
        ],
      }),
      makeNotebook({ id: "plain-nb", notes: [makeNote()] }),
      makeNotebook({
        id: "trashed-nb",
        deletedAt: 1,
        notes: [makeNote()],
      }),
      makeNotebook({ id: "empty-nb", notes: [] }),
    ];

    const counts = computeSidebarCounts(notebooks);

    expect(counts.visibleNotebooks.map((notebook) => notebook.id)).toEqual([
      "pinned-nb",
      "plain-nb",
      "empty-nb",
    ]);
    expect(counts.totalNotes).toBe(3);
    expect(counts.trashedCount).toBe(2);
    expect(counts.favoriteCount).toBe(1);
    expect(counts.pinnedCount).toBe(1);
    expect(counts.recentCount).toBe(3);
  });

  it("derives move flags within pinned groups", () => {
    const notebooks = [
      makeNotebook({ id: "pinned-nb", pinned: true, notes: [] }),
      makeNotebook({ id: "plain-nb", notes: [] }),
      makeNotebook({ id: "empty-nb", notes: [] }),
    ];

    const { visibleNotebooks } = computeSidebarCounts(notebooks);

    expect(visibleNotebooks.map((notebook) => notebook.canMoveUp)).toEqual([
      false,
      false,
      true,
    ]);
    expect(visibleNotebooks.map((notebook) => notebook.canMoveDown)).toEqual([
      false,
      true,
      false,
    ]);
  });

  it("caps recent count at the recent-view limit", () => {
    const notes = Array.from({ length: 25 }, () => makeNote());
    const counts = computeSidebarCounts([makeNotebook({ id: "big", notes })]);
    expect(counts.totalNotes).toBe(25);
    expect(counts.recentCount).toBe(20);
  });
});
