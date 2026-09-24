import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { NoteModal } from "@/features/notes/components/NoteModal";
import { MoveNoteModal } from "@/features/notes/components/MoveNoteModal";
import type { NoteSaveInput } from "@/features/notes/types";
import type { Note, Notebook } from "@/shared/types";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";

// Mounted on demand (settings, search, shortcuts), so keep them out of the
// initial bundle.
const SettingsModal = lazy(() =>
  import("@/features/settings/components/SettingsModal").then((module) => ({
    default: module.SettingsModal,
  })),
);
const SearchPalette = lazy(() =>
  import("@/features/search/components/SearchPalette").then((module) => ({
    default: module.SearchPalette,
  })),
);
const ShortcutHelpOverlay = lazy(() =>
  import("@/features/shortcuts/components/ShortcutHelpOverlay").then(
    (module) => ({
      default: module.ShortcutHelpOverlay,
    }),
  ),
);

interface WorkspaceModalsProps {
  isSettingsOpen: boolean;
  onCloseSettings: () => void;
  isSearchOpen: boolean;
  onOpenSearchNote: (note: Note) => void;
  onCloseSearch: () => void;
  isShortcutHelpOpen: boolean;
  onCloseShortcutHelp: () => void;
  showNoteModal: boolean;
  editorNote: Note | null;
  activeNotebookId: string | null;
  visibleNotebooks: Notebook[];
  allTags: string[];
  tagUsage: Record<string, number>;
  isCreatingNote: boolean;
  onNoteSave: (data: NoteSaveInput) => Note | undefined;
  onCreateTag: (tag: string) => void;
  onDeleteTag: (tag: string) => void;
  onDeleteNoteById: (noteId: string) => void;
  onCloseNoteModal: () => void;
  confirm: { title: string } | null;
  onConfirmDeleteNotebook: (isConfirm: boolean) => void;
  pendingSelectNoteId: string | null;
  onConfirmPendingSelect: (isConfirm: boolean) => void;
  moveNoteTarget: Note | null;
  onMoveNoteToNotebook: (targetNotebookId: string) => void;
  onCloseMoveNote: () => void;
}

/** All workspace dialogs and overlays, rendered at the App root. */
export const WorkspaceModals = ({
  isSettingsOpen,
  onCloseSettings,
  isSearchOpen,
  onOpenSearchNote,
  onCloseSearch,
  isShortcutHelpOpen,
  onCloseShortcutHelp,
  showNoteModal,
  editorNote,
  activeNotebookId,
  visibleNotebooks,
  allTags,
  tagUsage,
  isCreatingNote,
  onNoteSave,
  onCreateTag,
  onDeleteTag,
  onDeleteNoteById,
  onCloseNoteModal,
  confirm,
  onConfirmDeleteNotebook,
  pendingSelectNoteId,
  onConfirmPendingSelect,
  moveNoteTarget,
  onMoveNoteToNotebook,
  onCloseMoveNote,
}: WorkspaceModalsProps) => {
  const { t } = useTranslation();

  return (
    <>
      {showNoteModal && (
        <NoteModal
          noteId={editorNote?.id}
          title={editorNote?.title}
          text={editorNote?.text}
          tags={editorNote?.tags}
          favorite={editorNote?.favorite}
          notebookId={editorNote?.notebookId ?? activeNotebookId ?? ""}
          notebooks={visibleNotebooks}
          tagSuggestions={allTags}
          tagUsage={tagUsage}
          isNew={isCreatingNote}
          postedOn={editorNote?.postedOn}
          updatedOn={editorNote?.updatedOn}
          onSave={onNoteSave}
          onCreateTag={onCreateTag}
          onDeleteTag={onDeleteTag}
          onDelete={onDeleteNoteById}
          onClose={onCloseNoteModal}
        />
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.title}
          onConfirm={onConfirmDeleteNotebook}
        />
      )}

      {pendingSelectNoteId && (
        <ConfirmModal
          heading={t("editor.unsavedTitle")}
          description={t("editor.unsavedSwitchDescription")}
          confirmLabel={t("editor.discard")}
          stacked
          onConfirm={onConfirmPendingSelect}
        />
      )}

      {moveNoteTarget && (
        <MoveNoteModal
          note={moveNoteTarget}
          notebooks={visibleNotebooks}
          onMove={onMoveNoteToNotebook}
          onClose={onCloseMoveNote}
        />
      )}

      {isSettingsOpen && (
        <Suspense fallback={null}>
          <SettingsModal onClose={onCloseSettings} />
        </Suspense>
      )}

      {isSearchOpen && (
        <Suspense fallback={null}>
          <SearchPalette
            onOpenNote={onOpenSearchNote}
            onClose={onCloseSearch}
          />
        </Suspense>
      )}

      {isShortcutHelpOpen && (
        <Suspense fallback={null}>
          <ShortcutHelpOverlay onClose={onCloseShortcutHelp} />
        </Suspense>
      )}
    </>
  );
};
