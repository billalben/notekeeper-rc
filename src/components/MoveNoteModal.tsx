import { useEffect } from "react";
import { useSettingsStore } from "../store/useSettingsStore";
import type { Note, Notebook } from "../types";
import { IconButton } from "./IconButton";

interface MoveNoteModalProps {
  note: Note;
  notebooks: Notebook[];
  onMove: (targetNotebookId: string) => void;
  onClose: () => void;
}

export const MoveNoteModal = ({
  note,
  notebooks,
  onMove,
  onClose,
}: MoveNoteModalProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const destinations = notebooks.filter(
    (notebook) =>
      notebook.deletedAt === null && notebook.id !== note.notebookId,
  );

  return (
    <>
      <div className="modal" role="dialog" aria-label="Move note">
        <IconButton
          type="button"
          icon="close"
          label="Close"
          onClick={onClose}
        />
        <h3 className="modal-title text-title-medium">
          Move <strong>"{note.title || "Untitled"}"</strong> to
        </h3>

        {destinations.length === 0 ? (
          <div className="move-note-empty text-body-medium">
            No other notebooks to move to.
          </div>
        ) : (
          <ul className="move-note-list custom-scrollbar">
            {destinations.map((notebook) => (
              <li key={notebook.id}>
                <button
                  type="button"
                  className="move-note-item"
                  onClick={() => onMove(notebook.id)}
                >
                  <span
                    className="material-symbols-rounded"
                    aria-hidden="true"
                  >
                    folder
                  </span>
                  <span className="text-label-large">{notebook.name}</span>
                  <div className="state-layer" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="modal-footer">
          <button className="btn text" type="button" onClick={onClose}>
            <span className="text-label-large">Cancel</span>
            <div className="state-layer" />
          </button>
        </div>
      </div>
      <div
        className="overlay modal-overlay"
        onClick={(event) => {
          if (
            useSettingsStore.getState().editor.closeModalOnBackdropClick &&
            event.target === event.currentTarget
          ) {
            onClose();
          }
        }}
      />
    </>
  );
};
