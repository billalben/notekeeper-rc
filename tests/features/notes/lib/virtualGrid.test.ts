import { describe, expect, it } from "vitest";
import {
  NOTE_CARD_MIN_WIDTH,
  NOTE_GRID_GAP,
  chunkRows,
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
