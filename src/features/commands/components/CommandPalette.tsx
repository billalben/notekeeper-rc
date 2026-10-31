import {
  Fragment,
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
import { useNoteSearch } from "@/features/search/hooks/useNoteSearch";
import {
  collectSearchEntries,
  type SearchResult,
} from "@/features/search/lib/search";
import {
  addSearchHistoryEntry,
  readSearchHistory,
  removeSearchHistoryEntry,
  writeSearchHistory,
} from "@/features/search/lib/searchHistory";
import {
  COMMAND_GROUP_LABELS,
  createCommands,
  filterCommands,
  parsePaletteQuery,
  type PaletteCommand,
} from "@/features/commands/lib/commands";
import { useBodyScrollLock } from "@/shared/hooks/useBodyScrollLock";
import { useRestoreFocus } from "@/shared/hooks/useRestoreFocus";
import { downloadBackupFile } from "@/shared/lib/export";
import { formatChord } from "@/shared/lib/shortcuts";
import { useNoteStore } from "@/shared/stores/useNoteStore";
import { useSettingsStore } from "@/shared/stores/useSettingsStore";
import { useThemeStore } from "@/shared/stores/useThemeStore";
import { toast } from "@/shared/stores/useToastStore";
import { useUIStore, type MainView } from "@/shared/stores/useUIStore";
import type { Note, SettingsSection } from "@/shared/types";

interface CommandPaletteProps {
  onOpenNote: (note: Note) => void;
  onClose: () => void;
  onNewNote: () => void;
  onCreateNotebook: () => void;
}

type PaletteItem =
  | { kind: "command"; command: PaletteCommand }
  | { kind: "note"; result: SearchResult };

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

const itemId = (index: number) => `command-palette-item-${index}`;

export const CommandPalette = ({
  onOpenNote,
  onClose,
  onNewNote,
  onCreateNotebook,
}: CommandPaletteProps) => {
  const { t } = useTranslation();
  const notebooks = useNoteStore((state) => state.notebooks);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const activeTags = useUIStore((state) => state.activeTags);
  const shortcuts = useSettingsStore((state) => state.shortcuts);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState(readSearchHistory);
  const deferredQuery = useDeferredValue(query);

  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  const parsedQuery = parsePaletteQuery(query);
  const deferredParsed = parsePaletteQuery(deferredQuery);
  const isIdle = query.trim().length === 0;
  const hasNoteQuery = !parsedQuery.commandOnly && query.trim().length > 0;
  const noteQuery = deferredParsed.commandOnly ? "" : deferredParsed.query;

  const entries = useMemo(() => collectSearchEntries(notebooks), [notebooks]);
  const { results, isIndexing, isPending } = useNoteSearch(entries, noteQuery);

  const isAwaitingResults =
    hasNoteQuery && (isIndexing || isPending || deferredQuery !== query);

  const navigate = useCallback((view: MainView) => {
    const ui = useUIStore.getState();
    switch (view) {
      case "all":
        ui.openAllNotes();
        break;
      case "recent":
        ui.openRecent();
        break;
      case "pinned":
        ui.openPinned();
        break;
      case "favorites":
        ui.openFavorites();
        break;
      case "trash":
        ui.openTrash();
        break;
      case "stats":
        ui.openStats();
        break;
      case "archive":
        ui.openArchive();
        break;
      default:
        ui.showNotes();
        break;
    }
  }, []);

  const selectNotebook = useCallback((notebookId: string) => {
    useNoteStore.getState().setActiveNotebook(notebookId);
    const ui = useUIStore.getState();
    ui.clearTagFilter();
    ui.showNotes();
  }, []);

  const openSettings = useCallback((section: SettingsSection) => {
    useUIStore.getState().openSettings(section);
  }, []);

  const openShortcutHelp = useCallback(() => {
    useUIStore.getState().openShortcutHelp();
  }, []);

  const openTour = useCallback(() => {
    useUIStore.getState().openTour();
  }, []);

  const clearTagFilter = useCallback(() => {
    useUIStore.getState().clearTagFilter();
  }, []);

  const exportBackup = useCallback(() => {
    const state = useNoteStore.getState();
    const hasVisibleNotebooks = state.notebooks.some(
      (notebook) => notebook.deletedAt === null,
    );
    if (!hasVisibleNotebooks) return;

    try {
      downloadBackupFile(state.notebooks, state.tags);
      toast.success(t("errors.exportSuccess"));
    } catch {
      toast.error(t("errors.exportFailed"));
    }
  }, [t]);

  const commands = useMemo(
    () =>
      createCommands({
        t,
        theme,
        notebooks,
        hasActiveTags: activeTags.length > 0,
        createNote: onNewNote,
        createNotebook: onCreateNotebook,
        toggleTheme,
        exportBackup,
        openSettings,
        navigate,
        selectNotebook,
        openShortcutHelp,
        openTour,
        clearTagFilter,
      }),
    [
      t,
      theme,
      notebooks,
      activeTags.length,
      onNewNote,
      onCreateNotebook,
      toggleTheme,
      exportBackup,
      openSettings,
      navigate,
      selectNotebook,
      openShortcutHelp,
      openTour,
      clearTagFilter,
    ],
  );

  const filteredCommands = useMemo(
    () => filterCommands(commands, parsedQuery.query),
    [commands, parsedQuery.query],
  );
  const visibleCommands =
    parsedQuery.commandOnly || parsedQuery.query.length === 0
      ? filteredCommands
      : filteredCommands.slice(0, 5);

  const items = useMemo<PaletteItem[]>(
    () => [
      ...visibleCommands.map((command): PaletteItem => ({
        kind: "command",
        command,
      })),
      ...results.map((result): PaletteItem => ({ kind: "note", result })),
    ],
    [visibleCommands, results],
  );
  const activeItemIndex =
    items.length === 0 ? 0 : Math.min(activeIndex, items.length - 1);

  const updateHistory = useCallback((next: string[]) => {
    setRecentSearches(next);
    writeSearchHistory(next);
  }, []);

  const rememberSearch = useCallback(
    (value: string) => {
      if (!value) return;
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

  const runCommand = useCallback(
    (command: PaletteCommand) => {
      if (command.disabled) return;
      onClose();
      command.run();
    },
    [onClose],
  );

  const openResult = useCallback(
    (result: SearchResult) => {
      rememberSearch(query.trim());
      onOpenNote(result.note);
    },
    [onOpenNote, query, rememberSearch],
  );

  useBodyScrollLock();
  useRestoreFocus();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    optionRefs.current[activeItemIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeItemIndex, items]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) =>
          items.length === 0
            ? 0
            : (Math.min(index, items.length - 1) + 1) % items.length,
        );
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) =>
          items.length === 0
            ? 0
            : (Math.min(index, items.length - 1) - 1 + items.length) %
              items.length,
        );
        return;
      }
      if (event.key === "Enter") {
        const item = items[activeItemIndex];
        if (!item) return;
        event.preventDefault();
        if (item.kind === "command") runCommand(item.command);
        else openResult(item.result);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [items, activeItemIndex, runCommand, openResult]);

  useActionHotkey("closeModal", onClose, { enableOnFormTags: true });
  useActionHotkey("openSearch", onClose, { enableOnFormTags: true });

  const renderCommand = (command: PaletteCommand, index: number) => {
    const isActive = index === activeItemIndex;
    const isDisabled = command.disabled === true;

    return (
      <li
        key={command.id}
        id={itemId(index)}
        ref={(element) => {
          optionRefs.current[index] = element;
        }}
        role="option"
        aria-selected={isActive}
        aria-disabled={isDisabled || undefined}
        className={`search-result command-result${
          isActive ? " active" : ""
        }${isDisabled ? " is-disabled" : ""}`}
        onMouseMove={() => setActiveIndex(index)}
        onClick={() => runCommand(command)}
      >
        <span
          className="material-symbols-rounded command-icon"
          aria-hidden="true"
        >
          {command.icon}
        </span>
        <span className="command-text">
          <span className="command-label text-body-large">{command.label}</span>
          {command.description && (
            <span className="command-description text-body-small">
              {command.description}
            </span>
          )}
        </span>
        {command.shortcut && (
          <kbd className="search-kbd command-kbd text-label-large">
            {formatChord(shortcuts[command.shortcut])}
          </kbd>
        )}
      </li>
    );
  };

  const renderNote = (result: SearchResult, index: number) => (
    <li
      key={result.note.id}
      id={itemId(index)}
      ref={(element) => {
        optionRefs.current[index] = element;
      }}
      role="option"
      aria-selected={index === activeItemIndex}
      className={`search-result${index === activeItemIndex ? " active" : ""}`}
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
        <span className="material-symbols-rounded" aria-hidden="true">
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
              (item) => item.tag.toLowerCase() === tag.toLowerCase(),
            );
            return (
              <span
                key={tag}
                className={`tag-chip search-tag-chip${match ? " active" : ""}`}
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
  );

  return (
    <>
      <div
        className="search-overlay"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div
          className="search-palette command-palette"
          role="dialog"
          aria-modal="true"
          aria-label={t("commands.title")}
        >
          <div className="search-input-row">
            <span className="material-symbols-rounded" aria-hidden="true">
              {parsedQuery.commandOnly ? "keyboard_command_key" : "search"}
            </span>
            <input
              ref={inputRef}
              type="text"
              className="search-input text-body-large"
              placeholder={t("commands.placeholder")}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              role="combobox"
              aria-expanded={items.length > 0}
              aria-controls="command-palette-list"
              aria-activedescendant={
                items[activeItemIndex] ? itemId(activeItemIndex) : undefined
              }
              aria-autocomplete="list"
            />
            <kbd className="search-kbd text-label-large">Esc</kbd>
          </div>

          <div className="command-body custom-scrollbar">
            {items.length > 0 && (
              <ul
                id="command-palette-list"
                className="command-list"
                role="listbox"
                aria-label={t("commands.title")}
              >
                {items.map((item, index) => {
                  const previous = items[index - 1];
                  if (item.kind === "command") {
                    const showGroup =
                      !previous ||
                      previous.kind !== "command" ||
                      previous.command.group !== item.command.group;

                    return (
                      <Fragment key={`command-${item.command.id}`}>
                        {showGroup && (
                          <li
                            className="command-group-label text-label-large"
                            role="presentation"
                          >
                            {t(COMMAND_GROUP_LABELS[item.command.group])}
                          </li>
                        )}
                        {renderCommand(item.command, index)}
                      </Fragment>
                    );
                  }

                  const showNotes = !previous || previous.kind !== "note";

                  return (
                    <Fragment key={`note-${item.result.note.id}`}>
                      {showNotes && (
                        <li
                          className="command-group-label text-label-large"
                          role="presentation"
                        >
                          {t("commands.notes")}
                        </li>
                      )}
                      {renderNote(item.result, index)}
                    </Fragment>
                  );
                })}
              </ul>
            )}

            {isIdle && recentSearches.length > 0 && (
              <div className="search-recent command-recent">
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
          </div>

          {items.length === 0 && !isAwaitingResults ? (
            <div className="search-empty">
              <span className="material-symbols-rounded" aria-hidden="true">
                search_off
              </span>
              <div className="text-body-large">
                {t("commands.empty", {
                  query: parsedQuery.query || query.trim(),
                })}
              </div>
            </div>
          ) : (
            <div className="search-footer text-label-large">
              {isIdle
                ? t("commands.hint")
                : isAwaitingResults
                  ? isIndexing
                    ? t("search.indexing")
                    : t("search.searching")
                  : t("search.resultCount", { count: items.length })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
