import { Trans, useTranslation } from "react-i18next";
import { useActionHotkey } from "../hooks/useActionHotkey";
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
  const { t } = useTranslation();

  useActionHotkey("closeModal", onClose, { enableOnFormTags: true });

  const destinations = notebooks.filter(
    (notebook) =>
      notebook.deletedAt === null && notebook.id !== note.notebookId,
  );

  return (
    <>
      <div className="modal" role="dialog" aria-label={t("move.label")}>
        <IconButton
          type="button"
          icon="close"
          label={t("common.close")}
          onClick={onClose}
        />
        <h3 className="modal-title text-title-medium">
          <Trans
            i18nKey="move.title"
            values={{ title: note.title || t("common.untitled") }}
            components={{ strong: <strong /> }}
          />
        </h3>

        {destinations.length === 0 ? (
          <div className="move-note-empty text-body-medium">
            {t("move.noDestinations")}
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
            <span className="text-label-large">{t("common.cancel")}</span>
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
