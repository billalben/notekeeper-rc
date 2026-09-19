import { useEffect, useState, type FormEvent } from "react";
import { countWords, getRelativeTime } from "../utils";
import { useSettingsStore } from "../store/useSettingsStore";
import { IconButton } from "./IconButton";

interface NoteModalProps {
  title?: string;
  text?: string;
  postedOn?: number;
  updatedOn?: number;
  onSubmit: (noteData: { title: string; text: string }) => void;
  onClose: () => void;
}

export const NoteModal = ({
  title: initialTitle = "",
  text: initialText = "",
  postedOn,
  updatedOn,
  onSubmit,
  onClose,
}: NoteModalProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [text, setText] = useState(initialText);
  const showWordCount = useSettingsStore((state) => state.editor.showWordCount);

  const isSubmitDisabled = !title.trim() && !text.trim();

  const words = countWords(`${title} ${text}`);
  const characters = title.length + text.length;
  const wordCountLabel = `${words} ${words === 1 ? "word" : "words"} · ${characters} ${
    characters === 1 ? "character" : "characters"
  }`;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const timeLabel = postedOn
    ? `Created ${getRelativeTime(postedOn)}${
        updatedOn && updatedOn !== postedOn
          ? ` · Edited ${getRelativeTime(updatedOn)}`
          : ""
      }`
    : "";

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitDisabled) return;
    onSubmit({ title, text });
  };

  return (
    <>
      <form className="modal" onSubmit={handleSubmit}>
        <IconButton
          type="button"
          icon="close"
          label="Close modal"
          onClick={onClose}
        />

        <input
          type="text"
          placeholder="Untitled"
          value={title}
          className="modal-title text-title-medium"
          data-note-field
          autoFocus
          onChange={(event) => setTitle(event.target.value)}
        />

        <textarea
          placeholder="Take a note..."
          value={text}
          className="modal-text text-body-large custom-scrollbar"
          data-note-field
          onChange={(event) => setText(event.target.value)}
        />

        <div className="modal-footer">
          <span className="time text-label-large">{timeLabel}</span>
          {showWordCount && (
            <span className="counts text-label-large" data-word-count>
              {wordCountLabel}
            </span>
          )}
          <button
            className="btn text"
            type="submit"
            disabled={isSubmitDisabled}
          >
            <span className="text-label-large">Save</span>
            <div className="state-layer" />
          </button>
        </div>
      </form>
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
