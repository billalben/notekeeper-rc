import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import type { RangeTuple } from "fuse.js";
import { useActionHotkey } from "@/features/shortcuts/hooks/useActionHotkey";
import { useNoteStore } from "@/shared/stores/useNoteStore";
import { useBodyScrollLock } from "@/shared/hooks/useBodyScrollLock";
import { useRestoreFocus } from "@/shared/hooks/useRestoreFocus";
import type { Note } from "@/shared/types";
import {
  collectSearchEntries,
  type SearchResult,
} from "@/features/search/lib/search";
import { useNoteSearch } from "@/features/search/hooks/useNoteSearch";
import {
  addSearchHistoryEntry,
  readSearchHistory,
  removeSearchHistoryEntry,
  writeSearchHistory,
} from "@/features/search/lib/searchHistory";

interface SearchPaletteProps {
  onOpenNote: (note: Note) => void;
  onClose: () => void;
}

const highlight = (
  text: string,
  ranges: ReadonlyArray<RangeTuple>,
): ReactNode => {
  if (ranges.length === 0) return text;

  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const nodes: ReactNode[] = [];
  let cursor = 0;

  sorted.forEach(([start, end], index) => {
    if (start < cursor) return;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    nodes.push(
      <mark key={index} className="search-highlight">
        {text.slice(start, end + 1)}
      </mark>,
    );
    cursor = end + 1;
  });

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
};

const itemId = (index: number) => `search-result-${index}`;

export const SearchPalette = ({ onOpenNote, onClose }: SearchPaletteProps) => {
  const { t } = useTranslation();
  const notebooks = useNoteStore((state) => state.notebooks);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState(readSearchHistory);
  const deferredQuery = useDeferredValue(query);

  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  const entries = useMemo(() => collectSearchEntries(notebooks), [notebooks]);
  const { results, isIndexing, isPending } = useNoteSearch(
    entries,
    deferredQuery,
  );

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0;
  const isAwaitingResults =
    isSearching && (isIndexing || isPending || deferredQuery !== query);

  const updateHistory = useCallback((next: string[]) => {
    setRecentSearches(next);
    writeSearchHistory(next);
  }, []);

  const rememberSearch = useCallback(
    (value: string) => {
      updateHistory(addSearchHistoryEntry(recentSearches, value));
    },
    [recentSearches, updateHistory],
  );

  const removeRecent = (value: string) => {
    updateHistory(removeSearchHistoryEntry(recentSearches, value));
  };

  const applyRecentSearch = (value: string) => {
    setQuery(value);
    setActiveIndex(0);
    inputRef.current?.focus();
  };

  const openResult = useCallback(
    (result: SearchResult) => {
      rememberSearch(trimmedQuery);
      onOpenNote(result.note);
    },
    [onOpenNote, rememberSearch, trimmedQuery],
  );

  useBodyScrollLock();
  useRestoreFocus();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, results]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) =>
          results.length === 0 ? 0 : (index + 1) % results.length,
        );
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) =>
          results.length === 0
            ? 0
            : (index - 1 + results.length) % results.length,
        );
        return;
      }
      if (event.key === "Enter") {
        const result = results[activeIndex];
        if (result) {
          event.preventDefault();
          openResult(result);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [results, activeIndex, openResult]);

  useActionHotkey("closeModal", onClose, { enableOnFormTags: true });
  useActionHotkey("openSearch", onClose, { enableOnFormTags: true });

  return (
    <>
      <div
        className="search-overlay"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div
          className="search-palette"
          role="dialog"
          aria-modal="true"
          aria-label={t("search.label")}
        >
          <div className="search-input-row">
            <span className="material-symbols-rounded" aria-hidden="true">
              search
            </span>
            <input
              ref={inputRef}
              type="text"
              className="search-input text-body-large"
              placeholder={t("search.placeholder")}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls="search-results"
              aria-activedescendant={
                results[activeIndex] ? itemId(activeIndex) : undefined
              }
              aria-autocomplete="list"
            />
            <kbd className="search-kbd text-label-large">Esc</kbd>
          </div>

          {isSearching ? (
            results.length > 0 ? (
              <>
                <ul
                  id="search-results"
                  className="search-results custom-scrollbar"
                  role="listbox"
                  aria-label={t("search.results")}
                >
                  {results.map((result: SearchResult, index) => (
                    <li
                      key={result.note.id}
                      id={itemId(index)}
                      ref={(element) => {
                        optionRefs.current[index] = element;
                      }}
                      role="option"
                      aria-selected={index === activeIndex}
                      className={`search-result${
                        index === activeIndex ? " active" : ""
                      }`}
                      onMouseMove={() => setActiveIndex(index)}
                      onClick={() => openResult(result)}
                    >
                      <div className="search-result-title text-body-large">
                        {highlight(
                          result.note.title || t("common.untitled"),
                          result.titleRanges,
                        )}
                      </div>
                      <div className="search-result-meta text-label-large">
                        <span
                          className="material-symbols-rounded"
                          aria-hidden="true"
                        >
                          folder
                        </span>
                        {result.notebookName}
                        {result.note.pinned && (
                          <span
                            className="material-symbols-rounded"
                            aria-label={t("card.pinned")}
                            title={t("card.pinned")}
                          >
                            push_pin
                          </span>
                        )}
                        {result.note.favorite && (
                          <span
                            className="material-symbols-rounded"
                            aria-label={t("card.favorite")}
                            title={t("card.favorite")}
                          >
                            star
                          </span>
                        )}
                      </div>
                      {result.note.tags.length > 0 && (
                        <div className="search-result-tags">
                          {result.note.tags.map((tag) => {
                            const match = result.tagMatches.find(
                              (item) =>
                                item.tag.toLowerCase() === tag.toLowerCase(),
                            );
                            return (
                              <span
                                key={tag}
                                className={`tag-chip search-tag-chip${
                                  match ? " active" : ""
                                }`}
                              >
                                <span className="text-label-large">
                                  #{match ? highlight(tag, match.ranges) : tag}
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {result.snippet && (
                        <div className="search-result-snippet text-body-small">
                          {result.snippet}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="search-footer text-label-large">
                  {isAwaitingResults
                    ? t("search.searching")
                    : t("search.resultCount", { count: results.length })}
                </div>
              </>
            ) : isAwaitingResults ? (
              <div className="search-empty">
                <span className="material-symbols-rounded" aria-hidden="true">
                  search
                </span>
                <div className="text-body-large">
                  {isIndexing ? t("search.indexing") : t("search.searching")}
                </div>
              </div>
            ) : (
              <div className="search-empty">
                <span className="material-symbols-rounded" aria-hidden="true">
                  search_off
                </span>
                <div className="text-body-large">
                  {t("search.noMatches", { query: trimmedQuery })}
                </div>
              </div>
            )
          ) : (
            <div className="search-idle custom-scrollbar">
              {recentSearches.length > 0 && (
                <div className="search-recent">
                  <div className="search-recent-header text-label-large">
                    <span>{t("search.recent")}</span>
                    <button
                      type="button"
                      className="search-recent-clear"
                      onClick={() => updateHistory([])}
                    >
                      {t("search.clearRecent")}
                    </button>
                  </div>
                  <ul className="search-recent-list">
                    {recentSearches.map((recent) => (
                      <li key={recent} className="search-recent-item">
                        <button
                          type="button"
                          className="search-recent-query"
                          onClick={() => applyRecentSearch(recent)}
                        >
                          <span
                            className="material-symbols-rounded"
                            aria-hidden="true"
                          >
                            history
                          </span>
                          <span>{recent}</span>
                        </button>
                        <button
                          type="button"
                          className="search-recent-remove"
                          aria-label={t("search.removeRecent", {
                            query: recent,
                          })}
                          title={t("search.removeRecent", { query: recent })}
                          onClick={() => removeRecent(recent)}
                        >
                          <span
                            className="material-symbols-rounded"
                            aria-hidden="true"
                          >
                            close
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="search-empty">
                <span className="material-symbols-rounded" aria-hidden="true">
                  search
                </span>
                <div className="text-body-large">{t("search.hint")}</div>
                <div className="search-operators text-label-large">
                  {t("search.operatorsHint")}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
