import { describe, expect, it } from "vitest";
import { makeNote } from "@tests/factories";
import {
  formatAverage,
  formatNumber,
  notePreview,
} from "@/features/statistics/lib/format";

describe("formatNumber", () => {
  it("formats with locale grouping", () => {
    expect(formatNumber(1234, "en-US")).toBe("1,234");
  });
});

describe("formatAverage", () => {
  it("keeps integers plain", () => {
    expect(formatAverage(5, "en-US")).toBe("5");
  });

  it("rounds fractions to at most one decimal", () => {
    expect(formatAverage(5.5, "en-US")).toBe("5.5");
    expect(formatAverage(5.25, "en-US")).toBe("5.3");
  });
});

describe("notePreview", () => {
  it("strips markdown and collapses whitespace", () => {
    expect(notePreview(makeNote({ text: "**hello**   `world`" }))).toBe(
      "hello world",
    );
  });

  it("returns an empty string for empty content", () => {
    expect(notePreview(makeNote({ text: "   \n  " }))).toBe("");
  });

  it("truncates long previews with an ellipsis", () => {
    const preview = notePreview(makeNote({ text: "a".repeat(200) }));
    expect(preview).toBe(`${"a".repeat(140)}…`);
  });
});
