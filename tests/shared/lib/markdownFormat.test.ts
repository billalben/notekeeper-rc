import { describe, expect, it } from "vitest";
import { toggleLinePrefix, wrapSelection } from "@/shared/lib/markdownFormat";

describe("wrapSelection", () => {
  it("wraps the selected text and keeps it selected", () => {
    expect(wrapSelection("hello world", 6, 11, "**", "**", "text")).toEqual({
      value: "hello **world**",
      selectionStart: 8,
      selectionEnd: 13,
    });
  });

  it("inserts the placeholder when there is no selection", () => {
    expect(wrapSelection("hello ", 6, 6, "**", "**", "text")).toEqual({
      value: "hello **text**",
      selectionStart: 8,
      selectionEnd: 12,
    });
  });
});

describe("toggleLinePrefix", () => {
  it("prepends the prefix to every line the selection touches", () => {
    expect(toggleLinePrefix("one\ntwo", 0, 7, "> ")).toEqual({
      value: "> one\n> two",
      selectionStart: 0,
      selectionEnd: 11,
    });
  });

  it("removes the prefix from every line when all already have it", () => {
    expect(toggleLinePrefix("> one\n> two", 0, 13, "> ")).toEqual({
      value: "one\ntwo",
      selectionStart: 0,
      selectionEnd: 7,
    });
  });

  it("expands a partial selection to whole lines", () => {
    expect(toggleLinePrefix("aa\nbb", 1, 3, "- ").value).toBe("- aa\n- bb");
  });
});
