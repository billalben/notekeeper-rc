import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ClipboardEvent as ReactClipboardEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { countWords } from "../utils";
import { copyText } from "../utils/clipboard";
import { useRelativeTime } from "../hooks/useRelativeTime";
import { formatChord } from "../utils/shortcuts";
import { downloadFile, MIME_MARKDOWN, slugify } from "../utils/export";
import { toast } from "../store/useToastStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { useUIStore } from "../store/useUIStore";
import { useActionHotkey } from "../hooks/useActionHotkey";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { useAutoSave } from "../hooks/useAutoSave";
import {
  toggleLinePrefix,
  wrapSelection,
  type EditResult,
} from "../utils/markdownFormat";
import { ConfirmModal } from "./ConfirmModal";
import { MarkdownContent } from "./MarkdownContent";
import { NoteTags } from "./NoteTags";
import { NoteToolbar, type EditorMode, type FormatKind } from "./NoteToolbar";
import type { Note, Notebook } from "../types";

interface NoteDraft {
  title: string;
  text: string;
  tags: string[];
  notebookId: string;
  favorite: boolean;
}

export type NoteSaveInput = NoteDraft;

export type NoteEditorVariant = "modal" | "split";

const isSameDraft = (a: NoteDraft, b: NoteDraft): boolean =>
  a.title === b.title &&
  a.text === b.text &&
  a.notebookId === b.notebookId &&
  a.favorite === b.favorite &&
  a.tags.length === b.tags.length &&
  a.tags.every((tag, index) => tag === b.tags[index]);

export interface NoteEditorProps {
  variant?: NoteEditorVariant;
  noteId?: string;
  title?: string;
  text?: string;
  tags?: string[];
  favorite?: boolean;
  notebookId: string;
  notebooks: Notebook[];
  tagSuggestions: string[];
  tagUsage: Record<string, number>;
  isNew: boolean;
  postedOn?: number;
  updatedOn?: number;
  onSave: (data: NoteSaveInput) => Note | undefined;
  onCreateTag: (tag: string) => void;
  onDeleteTag: (tag: string) => void;
  onDelete?: (noteId: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onClose: () => void;
}

export const NoteEditor = ({
  variant = "modal",
  noteId: initialNoteId,
  title: initialTitle = "",
  text: initialText = "",
  tags: initialTags = [],
  favorite: initialFavorite = false,
  notebookId,
  notebooks,
  tagSuggestions,
  tagUsage,
  isNew,
  postedOn,
  updatedOn,
  onSave,
  onCreateTag,
  onDeleteTag,
  onDelete,
  onDirtyChange,
  onClose,
}: NoteEditorProps) => {
  const { t } = useTranslation();
  const relativeTime = useRelativeTime();
  const isModal = variant === "modal";
  const [title, setTitle] = useState(initialTitle);
  const [text, setText] = useState(initialText);
  const [tags, setTags] = useState(initialTags);
  const [favorite, setFavorite] = useState(initialFavorite);
  const [noteId, setNoteId] = useState(initialNoteId);
  const [selectedNotebookId, setSelectedNotebookId] = useState(notebookId);
  const [mode, setMode] = useState<EditorMode>("edit");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(updatedOn ?? null);
  const [savedSnapshot, setSavedSnapshot] = useState<NoteDraft>({
    title: initialTitle,
    text: initialText,
    tags: initialTags,
    notebookId,
    favorite: initialFavorite,
  });

  const autosave = useSettingsStore((state) => state.editor.autosave);
  const showWordCount = useSettingsStore((state) => state.editor.showWordCount);
  const presentation = useSettingsStore((state) => state.editor.presentation);
  const saveChord = useSettingsStore((state) => state.shortcuts.saveNote);
  const isSettingsOpen = useUIStore((state) => state.isSettingsOpen);
  const isSearchOpen = useUIStore((state) => state.isSearchOpen);

  const isFullscreen = isModal && presentation === "full";

  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const pendingSelectionRef = useRef<{ start: number; end: number } | null>(
    null,
  );
  const copyTimerRef = useRef<number | null>(null);
  const initialIsNewRef = useRef(isNew);
  const dirtyChangeRef = useRef(onDirtyChange);

  const hasNote = Boolean(noteId);
  const hasNoteRef = useRef(hasNote);
  useEffect(() => {
    hasNoteRef.current = hasNote;
  }, [hasNote]);

  useEffect(() => {
    dirtyChangeRef.current = onDirtyChange;
  }, [onDirtyChange]);

  useFocusTrap(dialogRef, isModal && !isConfirmingClose);

  useEffect(() => {
    if (!isModal) return;
    if (initialIsNewRef.current) titleRef.current?.focus();
    else bodyRef.current?.focus();
  }, [isModal]);

  useEffect(
    () => () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    },
    [],
  );

  const draft = useMemo<NoteDraft>(
    () => ({
      title,
      text,
      tags,
      notebookId: selectedNotebookId,
      favorite,
    }),
    [title, text, tags, selectedNotebookId, favorite],
  );

  const dirty = !isSameDraft(draft, savedSnapshot);
  const isSavable =
    hasNote || Boolean(title.trim() || text.trim() || tags.length);

  const notebookValue = notebooks.some((nb) => nb.id === selectedNotebookId)
    ? selectedNotebookId
    : (notebooks[0]?.id ?? "");

  const words = useMemo(() => countWords(text), [text]);
  const wordCountLabel = t("editor.wordCount", { count: words });

  const showEdited =
    postedOn !== undefined && savedAt !== null && savedAt - postedOn > 1000;

  useEffect(() => {
    dirtyChangeRef.current?.(dirty);
  }, [dirty]);

  const persist = (data: NoteDraft) => {
    const result = onSave(data);
    if (!hasNoteRef.current) {
      if (!result) return;
      setNoteId(result.id);
      setSelectedNotebookId(result.notebookId);
      setFavorite(result.favorite);
    }
    setSavedAt(Date.now());
    setSavedSnapshot(data);
  };

  const shouldSave = (data: NoteDraft) =>
    hasNoteRef.current ||
    Boolean(data.title.trim() || data.text.trim() || data.tags.length);

  const { status, schedule, flush } = useAutoSave<NoteDraft>({
    onSave: persist,
    shouldSave,
  });

  useEffect(() => {
    if (!autosave || !dirty) return;
    schedule(draft);
  }, [autosave, dirty, draft, schedule]);

  useLayoutEffect(() => {
    const pending = pendingSelectionRef.current;
    if (!pending || !bodyRef.current) return;
    bodyRef.current.focus();
    bodyRef.current.setSelectionRange(pending.start, pending.end);
    pendingSelectionRef.current = null;
  }, [text]);

  const applyEdit = (result: EditResult) => {
    pendingSelectionRef.current = {
      start: result.selectionStart,
      end: result.selectionEnd,
    };
    setText(result.value);
  };

  const handleFormat = (kind: FormatKind) => {
    const element = bodyRef.current;
    if (!element) return;

    const { selectionStart, selectionEnd, value } = element;
    let result: EditResult;

    switch (kind) {
      case "h":
        result = toggleLinePrefix(value, selectionStart, selectionEnd, "## ");
        break;
      case "ul":
        result = toggleLinePrefix(value, selectionStart, selectionEnd, "- ");
        break;
      case "task":
        result = toggleLinePrefix(
          value,
          selectionStart,
          selectionEnd,
          "- [ ] ",
        );
        break;
      case "b":
        result = wrapSelection(
          value,
          selectionStart,
          selectionEnd,
          "**",
          "**",
          "bold",
        );
        break;
      case "i":
        result = wrapSelection(
          value,
          selectionStart,
          selectionEnd,
          "*",
          "*",
          "italic",
        );
        break;
      case "code":
        result = wrapSelection(
          value,
          selectionStart,
          selectionEnd,
          "`",
          "`",
          "code",
        );
        break;
    }

    applyEdit(result);
  };

  const handleModeChange = (next: EditorMode) => {
    setMode(next);
    if (next === "edit") {
      requestAnimationFrame(() => bodyRef.current?.focus());
    }
  };

  const handleSave = () => {
    if (!dirty || !isSavable) return;
    persist(draft);
  };

  const handleDiscard = () => {
    setTitle(savedSnapshot.title);
    setText(savedSnapshot.text);
    setTags(savedSnapshot.tags);
    setSelectedNotebookId(savedSnapshot.notebookId);
    setFavorite(savedSnapshot.favorite);
  };

  const requestClose = () => {
    if (autosave) {
      flush();
      onClose();
      return;
    }
    if (dirty) {
      setIsConfirmingClose(true);
      return;
    }
    onClose();
  };

  const handleDownload = () => {
    try {
      const filename = `${slugify(title) || "note"}.md`;
      downloadFile(
        filename,
        `# ${title || t("common.untitledNote")}\n\n${text}`,
        MIME_MARKDOWN,
      );
    } catch {
      toast.error(t("toasts.exportNoteFailed"));
    }
  };

  const handleCopy = async () => {
    const content = title.trim() ? `${title}\n\n${text}` : text;
    const copied = await copyText(content);
    if (copied) {
      toast.success(t("toasts.copyNoteSuccess"));
      setCopied(true);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 1500);
    } else {
      toast.error(t("toasts.copyNoteFailed"));
    }
  };

  const handleTitlePaste = (event: ReactClipboardEvent<HTMLInputElement>) => {
    if (title.trim() || text.trim()) return;
    const pasted = event.clipboardData?.getData("text/plain") ?? "";
    const normalized = pasted.replace(/\r\n?/g, "\n");
    const splitAt = normalized.indexOf("\n\n");
    if (splitAt === -1) return;
    event.preventDefault();
    setTitle(normalized.slice(0, splitAt).trim());
    setText(normalized.slice(splitAt + 2).replace(/^\n+/, ""));
    requestAnimationFrame(() => bodyRef.current?.focus());
  };

  const handleTitleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      bodyRef.current?.focus();
    }
  };

  const formatRef = useRef(handleFormat);
  useEffect(() => {
    formatRef.current = handleFormat;
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const mod = event.ctrlKey || event.metaKey;
      if (!mod || event.target !== bodyRef.current) return;

      const key = event.key.toLowerCase();
      if (key === "b" || key === "i") {
        event.preventDefault();
        formatRef.current(key === "b" ? "b" : "i");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useActionHotkey("closeModal", requestClose, {
    enabled: !isConfirmingClose && !isSettingsOpen && !isSearchOpen,
    enableOnFormTags: true,
  });
  useActionHotkey(
    "saveNote",
    () => {
      if (autosave) flush();
      else handleSave();
    },
    { enableOnFormTags: true },
  );
  useActionHotkey(
    "togglePreview",
    () => handleModeChange(mode === "edit" ? "preview" : "edit"),
    { enableOnFormTags: true },
  );
  useActionHotkey("downloadNote", handleDownload, { enableOnFormTags: true });
  useActionHotkey("copyNote", handleCopy, { enableOnFormTags: true });
  useActionHotkey(
    "deleteNote",
    () => {
      if (noteId) onDelete?.(noteId);
    },
    { enabled: Boolean(noteId) && Boolean(onDelete), enableOnFormTags: true },
  );

  const statusLabel = dirty
    ? autosave && status === "saving"
      ? t("editor.statusSaving")
      : t("editor.statusDirty")
    : t("editor.statusSaved");

  const dialog = (
    <div
      ref={dialogRef}
      className={`note-dialog${
        isFullscreen
          ? " is-fullscreen"
          : isModal && isExpanded
            ? " is-expanded"
            : ""
      }${isModal ? "" : " is-inline"}`}
      role={isModal ? "dialog" : undefined}
      aria-modal={isModal ? "true" : undefined}
      aria-labelledby={titleId}
    >
      <div className="note-top">
        <label
          className="note-notebook"
          title={t("editor.moveToNotebookTitle")}
        >
          <span className="material-symbols-rounded" aria-hidden="true">
            folder
          </span>
          <select
            aria-label={t("editor.notebookLabel")}
            value={notebookValue}
            onChange={(event) => setSelectedNotebookId(event.target.value)}
          >
            {notebooks.map((notebook) => (
              <option key={notebook.id} value={notebook.id}>
                {notebook.name}
              </option>
            ))}
          </select>
          <span
            className="material-symbols-rounded note-chevron"
            aria-hidden="true"
          >
            expand_more
          </span>
        </label>

        <div className="note-actions">
          <button
            type="button"
            className="note-icon-btn"
            aria-pressed={favorite}
            aria-label={
              favorite ? t("editor.favoriteRemove") : t("editor.favoriteAdd")
            }
            title={
              favorite ? t("editor.favoriteRemove") : t("editor.favoriteAdd")
            }
            onClick={() => setFavorite((current) => !current)}
          >
            <svg className="note-fav" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
            </svg>
          </button>
          {isModal && !isFullscreen && (
            <button
              type="button"
              className="note-icon-btn note-expand"
              aria-label={
                isExpanded ? t("editor.collapse") : t("editor.expand")
              }
              title={
                isExpanded ? t("editor.collapseShort") : t("editor.expandShort")
              }
              onClick={() => setIsExpanded((current) => !current)}
            >
              <span className="material-symbols-rounded" aria-hidden="true">
                {isExpanded ? "close_fullscreen" : "open_in_full"}
              </span>
            </button>
          )}
          <button
            type="button"
            className={`note-icon-btn${copied ? " is-copied" : ""}`}
            aria-label={copied ? t("editor.copied") : t("editor.copyNote")}
            title={copied ? t("editor.copied") : t("editor.copyNote")}
            onClick={handleCopy}
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              {copied ? "check" : "content_copy"}
            </span>
          </button>
          <button
            type="button"
            className="note-icon-btn"
            aria-label={t("editor.downloadMarkdown")}
            title={t("editor.downloadMarkdown")}
            onClick={handleDownload}
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              download
            </span>
          </button>
          <span className="note-sep" aria-hidden="true" />
          <button
            type="button"
            className="note-icon-btn"
            aria-label={isModal ? t("common.close") : t("editor.closePane")}
            title={isModal ? t("editor.closeTitle") : t("editor.closePane")}
            onClick={requestClose}
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              close
            </span>
          </button>
        </div>
      </div>

      <div className="note-head">
        <input
          id={titleId}
          ref={titleRef}
          type="text"
          className="note-title-input"
          placeholder={t("editor.titlePlaceholder")}
          autoComplete="off"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={handleTitleKeyDown}
          onPaste={handleTitlePaste}
        />
        <NoteTags
          tags={tags}
          suggestions={tagSuggestions}
          tagUsage={tagUsage}
          onChange={setTags}
          onCreateTag={onCreateTag}
          onDeleteTag={onDeleteTag}
        />
      </div>

      <NoteToolbar
        mode={mode}
        onModeChange={handleModeChange}
        onFormat={handleFormat}
      />

      <div className="note-editor">
        <textarea
          ref={bodyRef}
          className="note-textarea custom-scrollbar"
          placeholder={t("editor.bodyPlaceholder")}
          spellCheck
          value={text}
          disabled={mode === "preview"}
          style={{ visibility: mode === "edit" ? "visible" : "hidden" }}
          onChange={(event) => setText(event.target.value)}
        />
        {mode === "preview" && (
          <div className="note-preview custom-scrollbar">
            {text.trim() ? (
              <MarkdownContent text={text} className="markdown-body" />
            ) : (
              <p className="note-preview-empty">{t("editor.previewEmpty")}</p>
            )}
          </div>
        )}
      </div>

      <div className="note-foot">
        <div className="note-meta">
          <span
            className={`note-status${dirty ? " is-dirty" : ""}`}
            role="status"
            aria-live="polite"
          >
            {statusLabel}
          </span>
          {postedOn !== undefined && (
            <span className="note-created">
              {t("editor.createdRelative", {
                time: relativeTime(postedOn),
              })}
            </span>
          )}
          {showEdited && savedAt !== null && (
            <span className="note-updated">
              {t("editor.editedRelative", {
                time: relativeTime(savedAt),
              })}
            </span>
          )}
          {showWordCount && <span>{wordCountLabel}</span>}
        </div>

        <div className="note-foot-actions">
          {!autosave && dirty && (
            <button
              type="button"
              className="note-btn is-ghost"
              onClick={handleDiscard}
            >
              {t("editor.discard")}
            </button>
          )}
          {!autosave && (
            <button
              type="button"
              className="note-btn is-primary"
              disabled={!dirty || !isSavable}
              onClick={handleSave}
            >
              {t("editor.save")}
              <kbd>{formatChord(saveChord)}</kbd>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isModal ? (
        <div
          className={`note-overlay${isFullscreen ? " is-fullscreen" : ""}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) requestClose();
          }}
        >
          {dialog}
        </div>
      ) : (
        dialog
      )}

      {isConfirmingClose && (
        <ConfirmModal
          heading={t("editor.unsavedTitle")}
          description={t("editor.unsavedDescription")}
          confirmLabel={t("editor.discard")}
          stacked
          onConfirm={(confirm) => {
            setIsConfirmingClose(false);
            if (confirm) onClose();
          }}
        />
      )}
    </>
  );
};
