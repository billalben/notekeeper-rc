import { describe, expect, it } from "vitest";
import {
  addSearchHistoryEntry,
  MAX_RECENT_SEARCHES,
  readSearchHistory,
  removeSearchHistoryEntry,
  writeSearchHistory,
} from "@/features/search/lib/searchHistory";
import { SEARCH_HISTORY_STORAGE_KEY } from "@/shared/stores/storageKeys";

describe("search history", () => {
  it("adds a new query at the front and dedupes case-insensitively", () => {
    expect(addSearchHistoryEntry(["old", "Work"], "work")).toEqual([
      "work",
      "old",
    ]);
  });

  it("trims blanks and caps the list", () => {
    let history: string[] = ["  "];

    for (let index = 0; index < MAX_RECENT_SEARCHES + 2; index += 1) {
      history = addSearchHistoryEntry(history, `query ${index}`);
    }

    expect(history).toHaveLength(MAX_RECENT_SEARCHES);
    expect(history[0]).toBe(`query ${MAX_RECENT_SEARCHES + 1}`);
  });

  it("removes a query case-insensitively", () => {
    expect(removeSearchHistoryEntry(["Work", "other"], "work")).toEqual([
      "other",
    ]);
  });

  it("round-trips normalized history through storage", () => {
    writeSearchHistory(["  Alpha ", "alpha", "Beta"]);

    expect(readSearchHistory()).toEqual(["Alpha", "Beta"]);
  });

  it("returns an empty list for malformed or non-array storage", () => {
    localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, "{not json");
    expect(readSearchHistory()).toEqual([]);

    localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify({}));
    expect(readSearchHistory()).toEqual([]);
  });
});
