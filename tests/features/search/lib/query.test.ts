import { describe, expect, it } from "vitest";
import { makeNote } from "@tests/factories";
import {
  matchesSearchFilters,
  parseSearchQuery,
} from "@/features/search/lib/query";

const emptyFilters = {
  tags: [],
  notebooks: [],
  pinned: false,
  favorite: false,
  before: null,
  after: null,
};

describe("parseSearchQuery", () => {
  it("normalizes free text when there are no operators", () => {
    expect(parseSearchQuery("  quick   brown ")).toEqual({
      text: "quick brown",
      filters: emptyFilters,
    });
  });

  it("parses tag, notebook, and is operators", () => {
    const { text, filters } = parseSearchQuery(
      "tag:work notebook:Journal is:pinned is:favorite quick brown",
    );

    expect(text).toBe("quick brown");
    expect(filters).toMatchObject({
      tags: ["work"],
      notebooks: ["Journal"],
      pinned: true,
      favorite: true,
    });
  });

  it("supports quoted operator values", () => {
    const { text, filters } = parseSearchQuery(
      'tag:"deep work" notebook:"My Journal"',
    );

    expect(text).toBe("");
    expect(filters.tags).toEqual(["deep work"]);
    expect(filters.notebooks).toEqual(["My Journal"]);
  });

  it("dedupes tags and notebooks case-insensitively", () => {
    const { filters } = parseSearchQuery(
      "tag:Work tag:work notebook:Journal notebook:journal",
    );

    expect(filters.tags).toEqual(["Work"]);
    expect(filters.notebooks).toEqual(["Journal"]);
  });

  it("parses before and after dates as local start-of-day", () => {
    const { text, filters } = parseSearchQuery(
      "before:2026-01-01 after:2025-12-31",
    );

    expect(text).toBe("");
    expect(filters.before).toBe(new Date(2026, 0, 1).getTime());
    expect(filters.after).toBe(new Date(2025, 11, 31).getTime());
  });

  it("keeps unknown and invalid operators in the free text", () => {
    const { text, filters } = parseSearchQuery(
      "foo:bar before:not-a-date after:2026-02-31 is:archived",
    );

    expect(text).toBe("foo:bar before:not-a-date after:2026-02-31 is:archived");
    expect(filters).toEqual(emptyFilters);
  });

  it("keeps empty operator values as text", () => {
    expect(parseSearchQuery('tag:""').text).toBe('tag:""');
  });
});

describe("matchesSearchFilters", () => {
  const entry = {
    note: makeNote({
      title: "Entry",
      tags: ["Work", "Deep Work"],
      pinned: true,
      favorite: false,
      updatedOn: new Date(2025, 5, 15).getTime(),
    }),
    notebookId: "notebook-1",
    notebookName: "My Journal",
  };

  it("matches tags case-insensitively and requires every tag", () => {
    const { filters } = parseSearchQuery('tag:work tag:"deep work"');
    expect(matchesSearchFilters(entry, filters)).toBe(true);

    const missing = parseSearchQuery("tag:work tag:personal").filters;
    expect(matchesSearchFilters(entry, missing)).toBe(false);
  });

  it("matches notebook names partially and by id", () => {
    expect(
      matchesSearchFilters(entry, parseSearchQuery("notebook:journal").filters),
    ).toBe(true);
    expect(
      matchesSearchFilters(
        entry,
        parseSearchQuery("notebook:notebook-1").filters,
      ),
    ).toBe(true);
    expect(
      matchesSearchFilters(entry, parseSearchQuery("notebook:work").filters),
    ).toBe(false);
  });

  it("matches pinned/favorite and updated-date filters", () => {
    expect(
      matchesSearchFilters(entry, parseSearchQuery("is:pinned").filters),
    ).toBe(true);
    expect(
      matchesSearchFilters(entry, parseSearchQuery("is:favorite").filters),
    ).toBe(false);
    expect(
      matchesSearchFilters(
        entry,
        parseSearchQuery("before:2025-06-16").filters,
      ),
    ).toBe(true);
    expect(
      matchesSearchFilters(entry, parseSearchQuery("after:2025-06-15").filters),
    ).toBe(true);
    expect(
      matchesSearchFilters(
        entry,
        parseSearchQuery("before:2025-06-15").filters,
      ),
    ).toBe(false);
  });
});
