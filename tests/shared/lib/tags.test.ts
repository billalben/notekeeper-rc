import { describe, expect, it } from "vitest";
import { makeNote, makeNotebook } from "@tests/factories";
import {
  addTag,
  collectTags,
  hasTag,
  mergeTags,
  normalizeTag,
  removeTag,
  sortTags,
} from "@/shared/lib/tags";

describe("normalizeTag", () => {
  it("trims and collapses internal whitespace", () => {
    expect(normalizeTag("  hello   world  ")).toBe("hello world");
  });

  it("drops a single leading hash", () => {
    expect(normalizeTag("#project")).toBe("project");
    expect(normalizeTag("  # spaced  ")).toBe("spaced");
  });

  it("caps the length at 50 characters", () => {
    expect(normalizeTag("a".repeat(60))).toHaveLength(50);
  });
});

describe("hasTag", () => {
  it("matches case-insensitively", () => {
    expect(hasTag(["Work"], "work")).toBe(true);
    expect(hasTag(["work"], "WORK")).toBe(true);
    expect(hasTag(["work"], "home")).toBe(false);
  });
});

describe("addTag", () => {
  it("adds a normalized tag", () => {
    expect(addTag([], "#  road  map ")).toEqual(["road map"]);
  });

  it("returns the same reference when the tag is empty or duplicate", () => {
    const tags = ["work"];
    expect(addTag(tags, "   ")).toBe(tags);
    expect(addTag(tags, "WORK")).toBe(tags);
  });
});

describe("removeTag", () => {
  it("removes case-insensitively and returns a new array", () => {
    const tags = ["Work", "home"];
    const result = removeTag(tags, "work");
    expect(result).toEqual(["home"]);
    expect(result).not.toBe(tags);
  });
});

describe("sortTags", () => {
  it("sorts case-insensitively without mutating the input", () => {
    const tags = ["banana", "Apple", "cherry"];
    expect(sortTags(tags)).toEqual(["Apple", "banana", "cherry"]);
    expect(tags).toEqual(["banana", "Apple", "cherry"]);
  });
});

describe("mergeTags", () => {
  it("adds incoming tags deduped case-insensitively", () => {
    expect(mergeTags(["a"], ["A", "#b"])).toEqual(["a", "b"]);
  });
});

describe("collectTags", () => {
  it("dedupes case-insensitively, keeps first casing, sorts, and includes trashed items", () => {
    const notebooks = [
      makeNotebook({
        notes: [makeNote({ tags: ["Work", "home"] })],
      }),
      makeNotebook({
        deletedAt: 123,
        notes: [makeNote({ tags: ["work", "Fun"] })],
      }),
    ];

    expect(collectTags(notebooks)).toEqual(["Fun", "home", "Work"]);
  });
});
