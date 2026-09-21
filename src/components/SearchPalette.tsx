import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import type { RangeTuple } from "fuse.js";
import { useActionHotkey } from "../hooks/useActionHotkey";
import { useNoteStore } from "../store/useNoteStore";
import type { Note } from "../types";
import {
  collectSearchEntries,
  createNoteSearchIndex,
  runSearch,
  type SearchResult,
} from "../utils/search";

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
  const deferredQuery = useDeferredValue(query);

  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  const entries = useMemo(() => collectSearchEntries(notebooks), [notebooks]);
  const fuse = useMemo(() => createNoteSearchIndex(entries), [entries]);
  const results = useMemo(
    () => runSearch(fuse, deferredQuery),
    [fuse, deferredQuery],
  );

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
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
          onOpenNote(result.note);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [results, activeIndex, onOpenNote]);

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
                      onClick={() => onOpenNote(result.note)}
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
                      </div>
                      {result.snippet && (
                        <div className="search-result-snippet text-body-small">
                          {result.snippet}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="search-footer text-label-large">
                  {t("search.resultCount", { count: results.length })}
                </div>
              </>
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
            <div className="search-empty">
              <span className="material-symbols-rounded" aria-hidden="true">
                search
              </span>
              <div className="text-body-large">{t("search.hint")}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
