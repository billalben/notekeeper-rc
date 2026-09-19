import { useEffect } from "react";
import { useSettingsStore } from "../store/useSettingsStore";

interface ConfirmModalProps {
  title: string;
  onConfirm: (isConfirm: boolean) => void;
}

export const ConfirmModal = ({ title, onConfirm }: ConfirmModalProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onConfirm(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onConfirm]);

  return (
    <>
      <div className="modal">
        <h3 className="modal-title text-title-medium">
          Are you sure you want to delete <strong>"{title}"</strong> ?
        </h3>
        <div className="modal-footer">
          <button
            className="btn text"
            type="button"
            onClick={() => onConfirm(false)}
          >
            <span className="text-label-large">Cancel</span>
            <div className="state-layer" />
          </button>
          <button
            className="btn fill"
            type="button"
            onClick={() => onConfirm(true)}
          >
            <span className="text-label-large">Delete</span>
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
            onConfirm(false);
          }
        }}
      />
    </>
  );
};
