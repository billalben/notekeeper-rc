import {
  useEffect,
  useId,
  useRef,
  useState,
  type ClipboardEvent as ReactClipboardEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { useActionHotkey } from "@/features/shortcuts/hooks/useActionHotkey";
import { copyText } from "@/shared/lib/clipboard";
import { downloadFile, MIME_MARKDOWN, slugify } from "@/shared/lib/export";
import { useFocusTrap } from "@/shared/hooks/useFocusTrap";
import { toast } from "@/shared/stores/useToastStore";
import { useSettingsStore } from "@/shared/stores/useSettingsStore";
import { useUIStore } from "@/shared/stores/useUIStore";
import type { Note, Notebook } from "@/shared/types";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { useAutoSave } from "../hooks/useAutoSave";
import { useMarkdownEditing } from "../hooks/useMarkdownEditing";
import { useNoteDraft } from "../hooks/useNoteDraft";
import type { NoteSaveInput } from "../types";
import { NoteEditorBody } from "./note-editor/NoteEditorBody";
import { NoteEditorFooter } from "./note-editor/NoteEditorFooter";
import { NoteEditorHeader } from "./note-editor/NoteEditorHeader";
import { NoteEditorTitle } from "./note-editor/NoteEditorTitle";
import { NoteToolbar, type EditorMode } from "./NoteToolbar";

type NoteEditorVariant = "modal" | "split";

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
  noteId,
  title: initialTitle,
  text: initialText,
  tags: initialTags,
  favorite: initialFavorite,
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
  const isModal = variant === "modal";

  const [mode, setMode] = useState<EditorMode>("edit");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);
  const [copied, setCopied] = useState(false);

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
  const copyTimerRef = useRef<number | null>(null);
  const initialIsNewRef = useRef(isNew);

  const {
    title,
    setTitle,
    text,
    setText,
    tags,
    setTags,
    favorite,
    setFavorite,
    noteId: draftNoteId,
    setSelectedNotebookId,
    notebookValue,
    draft,
    dirty,
    isSavable,
    words,
    savedAt,
    showEdited,
    persist,
    shouldSave,
    discard,
  } = useNoteDraft({
    noteId,
    title: initialTitle,
    text: initialText,
    tags: initialTags,
    favorite: initialFavorite,
    notebookId,
    notebooks,
    postedOn,
    updatedOn,
    onSave,
    onDirtyChange,
  });

  const { bodyRef, handleFormat } = useMarkdownEditing({ text, setText });

  const { status, schedule, flush } = useAutoSave({
    onSave: persist,
    shouldSave,
  });

  useEffect(() => {
    if (!autosave || !dirty) return;
    schedule(draft);
  }, [autosave, dirty, draft, schedule]);

  useFocusTrap(dialogRef, isModal && !isConfirmingClose);

  useEffect(() => {
    if (!isModal) return;
    if (initialIsNewRef.current) titleRef.current?.focus();
    else bodyRef.current?.focus();
  }, [isModal, bodyRef]);

  useEffect(
    () => () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    },
    [],
  );

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
    const succeeded = await copyText(content);
    if (succeeded) {
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
      if (draftNoteId) onDelete?.(draftNoteId);
    },
    {
      enabled: Boolean(draftNoteId) && Boolean(onDelete),
      enableOnFormTags: true,
    },
  );

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
      <NoteEditorHeader
        notebooks={notebooks}
        notebookValue={notebookValue}
        onNotebookChange={setSelectedNotebookId}
        favorite={favorite}
        onToggleFavorite={() => setFavorite((current) => !current)}
        isModal={isModal}
        isFullscreen={isFullscreen}
        isExpanded={isExpanded}
        onToggleExpanded={() => setIsExpanded((current) => !current)}
        copied={copied}
        onCopy={handleCopy}
        onDownload={handleDownload}
        onClose={requestClose}
      />

      <NoteEditorTitle
        titleId={titleId}
        titleRef={titleRef}
        title={title}
        onTitleChange={setTitle}
        onTitleKeyDown={handleTitleKeyDown}
        onTitlePaste={handleTitlePaste}
        tags={tags}
        tagSuggestions={tagSuggestions}
        tagUsage={tagUsage}
        onTagsChange={setTags}
        onCreateTag={onCreateTag}
        onDeleteTag={onDeleteTag}
      />

      <NoteToolbar
        mode={mode}
        onModeChange={handleModeChange}
        onFormat={handleFormat}
      />

      <NoteEditorBody
        bodyRef={bodyRef}
        text={text}
        onTextChange={setText}
        mode={mode}
      />

      <NoteEditorFooter
        dirty={dirty}
        status={status}
        autosave={autosave}
        isSavable={isSavable}
        wordCount={words}
        showWordCount={showWordCount}
        postedOn={postedOn}
        savedAt={savedAt}
        showEdited={showEdited}
        saveChord={saveChord}
        onDiscard={discard}
        onSave={handleSave}
      />
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
