import { useTranslation } from "react-i18next";
import type { KeyboardEvent, PointerEvent } from "react";
import { NoteEditor } from "@/features/notes/components/NoteEditor";
import type { NoteSaveInput } from "@/features/notes/types";
import type { Note, Notebook } from "@/shared/types";

interface SplitEditorPaneProps {
  isCreatingNote: boolean;
  note: Note | null;
  activeNotebookId: string | null;
  notebooks: Notebook[];
  tagSuggestions: string[];
  tagUsage: Record<string, number>;
  isResizing: boolean;
  onResizeStart: (event: PointerEvent<HTMLDivElement>) => void;
  onResizeKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onSave: (data: NoteSaveInput) => Note | undefined;
  onCreateTag: (tag: string) => void;
  onDeleteTag: (tag: string) => void;
  onDelete: (noteId: string) => void;
  onDirtyChange: (dirty: boolean) => void;
  onClose: () => void;
}

/** The right-hand editor pane used in the split presentation. */
export const SplitEditorPane = ({
  isCreatingNote,
  note,
  activeNotebookId,
  notebooks,
  tagSuggestions,
  tagUsage,
  isResizing,
  onResizeStart,
  onResizeKeyDown,
  onSave,
  onCreateTag,
  onDeleteTag,
  onDelete,
  onDirtyChange,
  onClose,
}: SplitEditorPaneProps) => {
  const { t } = useTranslation();

  return (
    <aside className="split-editor" data-split-editor>
      <div
        className={`split-resizer${isResizing ? " resizing" : ""}`}
        role="separator"
        aria-orientation="vertical"
        aria-label={t("editor.resizePane")}
        tabIndex={0}
        onPointerDown={onResizeStart}
        onKeyDown={onResizeKeyDown}
      />
      <NoteEditor
        key={isCreatingNote ? "new" : note?.id}
        variant="split"
        noteId={isCreatingNote ? undefined : note?.id}
        title={isCreatingNote ? undefined : note?.title}
        text={isCreatingNote ? undefined : note?.text}
        tags={isCreatingNote ? undefined : note?.tags}
        favorite={isCreatingNote ? undefined : note?.favorite}
        notebookId={
          isCreatingNote
            ? (activeNotebookId ?? "")
            : (note?.notebookId ?? activeNotebookId ?? "")
        }
        notebooks={notebooks}
        tagSuggestions={tagSuggestions}
        tagUsage={tagUsage}
        isNew={isCreatingNote}
        postedOn={isCreatingNote ? undefined : note?.postedOn}
        updatedOn={isCreatingNote ? undefined : note?.updatedOn}
        onSave={onSave}
        onCreateTag={onCreateTag}
        onDeleteTag={onDeleteTag}
        onDelete={onDelete}
        onDirtyChange={onDirtyChange}
        onClose={onClose}
      />
    </aside>
  );
};
