import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { TagFilterBar } from "@/features/tags/components/TagFilterBar";
import { NoteList } from "@/features/notes/components/NoteList";
import { NotesPanel } from "@/features/notes/components/NotesPanel";
import { TrashView } from "@/features/trash/components/TrashView";
import type {
  NoteListHandlers,
  NoteWithMoveFlags,
} from "@/features/notes/types";
import type { MainView } from "@/shared/stores/useUIStore";
import type { Note } from "@/shared/types";
import { Fab } from "@/shared/ui/Fab";
import { MaterialIcon } from "@/shared/ui/MaterialIcon";

const StatisticsView = lazy(() =>
  import("@/features/statistics/components/StatisticsView").then((module) => ({
    default: module.StatisticsView,
  })),
);

export interface MainPanelProps {
  view: MainView;
  isFiltering: boolean;
  tagFilterLabel: string;
  activeNotebookName: string;
  allTags: string[];
  activeTags: string[];
  onToggleTag: (tag: string) => void;
  allNotes: NoteWithMoveFlags[];
  recentNotes: NoteWithMoveFlags[];
  pinnedNotes: NoteWithMoveFlags[];
  favoriteNotes: NoteWithMoveFlags[];
  activeNotes: NoteWithMoveFlags[];
  canMoveToNotebook: boolean;
  notebookNames: Record<string, string>;
  hasVisibleNotebooks: boolean;
  isSplitEnabled: boolean;
  selectedNoteId: string | null;
  handlers: NoteListHandlers;
  onOpenRecent: (note: Note) => void;
  onOpenStatsNote: (note: Note) => void;
  onNewNote: () => void;
  onCreateNotebook: () => void;
}

export const MainPanel = ({
  view,
  isFiltering,
  tagFilterLabel,
  activeNotebookName,
  allTags,
  activeTags,
  onToggleTag,
  allNotes,
  recentNotes,
  pinnedNotes,
  favoriteNotes,
  activeNotes,
  canMoveToNotebook,
  notebookNames,
  hasVisibleNotebooks,
  isSplitEnabled,
  selectedNoteId,
  handlers,
  onOpenRecent,
  onOpenStatsNote,
  onNewNote,
  onCreateNotebook,
}: MainPanelProps) => {
  const { t } = useTranslation();

  if (view === "stats") {
    return (
      <Suspense fallback={null}>
        <StatisticsView onOpenNote={onOpenStatsNote} onNewNote={onNewNote} />
      </Suspense>
    );
  }

  if (view === "trash") return <TrashView />;

  const listProps = {
    canMoveToNotebook,
    selectedNoteId: isSplitEnabled ? selectedNoteId : undefined,
    ...handlers,
  };

  if (view === "all") {
    return (
      <NotesPanel
        title={t("notes.allNotes")}
        notes={allNotes}
        notebookNames={notebookNames}
        emptyMessage={t("notes.noNotesYet")}
        emptyIcon="note_stack"
        {...listProps}
      />
    );
  }

  if (view === "recent") {
    return (
      <NotesPanel
        title={t("notes.recent")}
        notes={recentNotes}
        notebookNames={notebookNames}
        emptyMessage={t("notes.noRecent")}
        emptyIcon="history"
        {...listProps}
        onOpen={isSplitEnabled ? handlers.onOpen : onOpenRecent}
      />
    );
  }

  if (view === "pinned") {
    return (
      <NotesPanel
        title={t("notes.pinned")}
        notes={pinnedNotes}
        notebookNames={notebookNames}
        emptyMessage={t("notes.noPinned")}
        emptyIcon="push_pin"
        {...listProps}
      />
    );
  }

  if (view === "favorites") {
    return (
      <NotesPanel
        title={t("notes.favorites")}
        notes={favoriteNotes}
        notebookNames={notebookNames}
        emptyMessage={t("notes.noFavorites")}
        emptyIcon="star"
        {...listProps}
      />
    );
  }

  return (
    <>
      <h2 className="title text-title-medium" data-note-panel-title>
        {isFiltering
          ? t("notes.notesTagged", { tags: tagFilterLabel })
          : activeNotebookName}
      </h2>

      <TagFilterBar
        tags={allTags}
        activeTags={activeTags}
        onToggle={onToggleTag}
      />

      {!hasVisibleNotebooks ? (
        <div className="note-list" data-note-panel>
          <div className="empty-notes">
            <MaterialIcon name="note_stack" />
            <div className="text-headline-small">{t("notes.noNotebooks")}</div>
            <button
              className="btn fill"
              type="button"
              onClick={onCreateNotebook}
            >
              <span className="text-label-large">
                {t("notes.createNotebook")}
              </span>
              <div className="state-layer" />
            </button>
          </div>
        </div>
      ) : (
        <NoteList
          notes={activeNotes}
          notebookNames={isFiltering ? notebookNames : undefined}
          emptyMessage={
            isFiltering
              ? t("notes.noNotesTagged", { tags: tagFilterLabel })
              : t("notes.noNotes")
          }
          {...listProps}
        />
      )}

      <Fab
        label={t("notes.newNote")}
        disabled={!hasVisibleNotebooks}
        onClick={onNewNote}
      />
    </>
  );
};
