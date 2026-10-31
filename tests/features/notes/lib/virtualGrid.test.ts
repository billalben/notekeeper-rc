import { describe, expect, it } from "vitest";
import {
  DEFAULT_NOTE_ROW_HEIGHT,
  NOTE_CARD_MIN_WIDTH,
  NOTE_GRID_GAP,
  buildRowOffsets,
  chunkRows,
  findVisibleRowRange,
  getColumnCount,
} from "@/features/notes/lib/virtualGrid";

describe("getColumnCount", () => {
  it("matches the CSS auto-fill breakpoints", () => {
    expect(getColumnCount(0)).toBe(1);
    expect(getColumnCount(Number.NaN)).toBe(1);
    expect(getColumnCount(NOTE_CARD_MIN_WIDTH - 1)).toBe(1);
    expect(getColumnCount(NOTE_CARD_MIN_WIDTH)).toBe(1);
    expect(getColumnCount(NOTE_CARD_MIN_WIDTH * 2 + NOTE_GRID_GAP - 1)).toBe(1);
    expect(getColumnCount(NOTE_CARD_MIN_WIDTH * 2 + NOTE_GRID_GAP)).toBe(2);
    expect(getColumnCount(NOTE_CARD_MIN_WIDTH * 3 + NOTE_GRID_GAP * 2)).toBe(3);
  });
});

describe("chunkRows", () => {
  it("groups items into rows of the requested width", () => {
    expect(chunkRows([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("falls back to one item per row for an invalid column count", () => {
    expect(chunkRows(["a", "b"], 0)).toEqual([["a"], ["b"]]);
  });

  it("returns no rows for an empty list", () => {
    expect(chunkRows([], 3)).toEqual([]);
  });
});

describe("buildRowOffsets", () => {
  it("adds a gap between rows but not after the final row", () => {
    expect(buildRowOffsets(3, (index) => [100, 200, 50][index], 8)).toEqual([
      0, 108, 316, 366,
    ]);
  });

  it("returns a single zero offset when there are no rows", () => {
    expect(buildRowOffsets(0, () => DEFAULT_NOTE_ROW_HEIGHT)).toEqual([0]);
  });

  it("never produces a zero-height row", () => {
    expect(buildRowOffsets(1, () => 0, 8)).toEqual([0, 1]);
  });
});

describe("findVisibleRowRange", () => {
  // Ten 100px rows with no gaps: row n starts at n * 100.
  const offsets = Array.from({ length: 11 }, (_, index) => index * 100);

  it("includes overscan rows above and below the viewport", () => {
    expect(findVisibleRowRange(offsets, 450, 550, 2)).toEqual({
      start: 2,
      end: 8,
    });
  });

  it("clamps the window at the start and end of the list", () => {
    expect(findVisibleRowRange(offsets, -500, -100, 2)).toEqual({
      start: 0,
      end: 3,
    });
    expect(findVisibleRowRange(offsets, 950, 1_200, 2)).toEqual({
      start: 7,
      end: 10,
    });
  });

  it("works without overscan", () => {
    expect(findVisibleRowRange(offsets, 450, 550, 0)).toEqual({
      start: 4,
      end: 6,
    });
  });

  it("returns an empty range when there are no rows", () => {
    expect(findVisibleRowRange([0], 0, 500)).toEqual({ start: 0, end: 0 });
  });
});
