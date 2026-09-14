import { useState, type FormEvent } from "react";
import { IconButton } from "./IconButton";

interface NoteModalProps {
  title?: string;
  text?: string;
  time?: string;
  onSubmit: (noteData: { title: string; text: string }) => void;
  onClose: () => void;
}

export const NoteModal = ({
  title: initialTitle = "Untitled",
  text: initialText = "add your note ...",
  time = "",
  onSubmit,
  onClose,
}: NoteModalProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [text, setText] = useState(initialText);

  const isSubmitDisabled = !title.trim() && !text.trim();

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
          <span className="time text-label-large">{time}</span>
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
      <div className="overlay modal-overlay" />
    </>
  );
};
