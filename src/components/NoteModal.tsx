import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { addTag, countWords, getRelativeTime, hasTag, removeTag } from "../utils";
import { useSettingsStore } from "../store/useSettingsStore";
import { IconButton } from "./IconButton";
import { MarkdownContent } from "./MarkdownContent";

interface NoteModalProps {
  title?: string;
  text?: string;
  tags?: string[];
  tagSuggestions: string[];
  tagUsage: Record<string, number>;
  onCreateTag: (tag: string) => void;
  onDeleteTag: (tag: string) => void;
  postedOn?: number;
  updatedOn?: number;
  onSubmit: (noteData: {
    title: string;
    text: string;
    tags: string[];
  }) => void;
  onClose: () => void;
}

const MAX_SUGGESTIONS = 8;

export const NoteModal = ({
  title: initialTitle = "",
  text: initialText = "",
  tags: initialTags = [],
  tagSuggestions,
  tagUsage,
  onCreateTag,
  onDeleteTag,
  postedOn,
  updatedOn,
  onSubmit,
  onClose,
}: NoteModalProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [text, setText] = useState(initialText);
  const [tags, setTags] = useState(initialTags);
  const [tagInput, setTagInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [mode, setMode] = useState<"edit" | "preview">("preview");
  const showWordCount = useSettingsStore((state) => state.editor.showWordCount);

  const suggestionsOpenRef = useRef(false);

  const isSubmitDisabled = !title.trim() && !text.trim() && tags.length === 0;

  const words = countWords(`${title} ${text}`);
  const characters = title.length + text.length;
  const wordCountLabel = `${words} ${words === 1 ? "word" : "words"} · ${characters} ${
    characters === 1 ? "character" : "characters"
  }`;

  const suggestions = useMemo(() => {
    const query = tagInput.trim().toLowerCase();
    return tagSuggestions
      .filter((tag) => {
        if (hasTag(tags, tag)) return false;
        return query ? tag.toLowerCase().includes(query) : true;
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [tagSuggestions, tags, tagInput]);

  useEffect(() => {
    suggestionsOpenRef.current = showSuggestions;
  }, [showSuggestions]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !suggestionsOpenRef.current) onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const commitTag = (raw: string) => {
    onCreateTag(raw);
    setTags((current) => addTag(current, raw));
    setTagInput("");
    setShowSuggestions(false);
    setHighlightedIndex(0);
  };

  const handleDeleteTag = (tag: string) => {
    onDeleteTag(tag);
    setTags((current) => removeTag(current, tag));
  };

  const handleTagInputKeyDown = (
    event: ReactKeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (!tagInput.trim()) return;
      const suggestion =
        showSuggestions && suggestions[highlightedIndex]
          ? suggestions[highlightedIndex]
          : tagInput;
      commitTag(suggestion);
      return;
    }

    if (event.key === ",") {
      event.preventDefault();
      if (tagInput.trim()) commitTag(tagInput);
      return;
    }

    if (event.key === "Backspace" && tagInput === "" && tags.length > 0) {
      event.preventDefault();
      setTags((current) => current.slice(0, -1));
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setShowSuggestions(true);
      setHighlightedIndex((index) =>
        Math.min(index + 1, suggestions.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === "Escape" && showSuggestions) {
      event.stopPropagation();
      setShowSuggestions(false);
    }
  };

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
    if (tagInput.trim()) onCreateTag(tagInput);
    const finalTags = tagInput.trim() ? addTag(tags, tagInput) : tags;
    onSubmit({ title, text, tags: finalTags });
  };

  return (
    <>
      <form className="modal note-modal" onSubmit={handleSubmit}>
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

        <div className="tag-editor">
          <div className="tag-input-row">
            <span
              className="material-symbols-rounded tag-input-icon"
              aria-hidden="true"
            >
              label
            </span>
            {tags.map((tag) => (
              <span key={tag} className="tag-chip">
                <span className="text-label-large">#{tag}</span>
                <button
                  type="button"
                  className="tag-chip-remove"
                  aria-label={`Remove tag ${tag}`}
                  onClick={() => setTags((current) => removeTag(current, tag))}
                >
                  <span className="material-symbols-rounded" aria-hidden="true">
                    close
                  </span>
                </button>
              </span>
            ))}
            <input
              type="text"
              className="tag-input"
              placeholder={tags.length === 0 ? "Add a tag..." : undefined}
              aria-label="Add a tag"
              value={tagInput}
              role="combobox"
              aria-expanded={showSuggestions && suggestions.length > 0}
              aria-controls="tag-suggestions"
              aria-autocomplete="list"
              onChange={(event) => {
                setTagInput(event.target.value);
                setHighlightedIndex(0);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                setHighlightedIndex(0);
                setShowSuggestions(true);
              }}
              onBlur={() => setShowSuggestions(false)}
              onKeyDown={handleTagInputKeyDown}
            />
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <ul
              id="tag-suggestions"
              className="tag-suggestions custom-scrollbar"
              role="listbox"
              aria-label="Tag suggestions"
            >
              {suggestions.map((tag, index) => {
                const usage = tagUsage[tag.toLowerCase()] ?? 0;

                return (
                  <li
                    key={tag}
                    role="option"
                    aria-selected={index === highlightedIndex}
                  >
                    <div
                      className={`tag-suggestion-row${
                        index === highlightedIndex ? " active" : ""
                      }`}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      <button
                        type="button"
                        className="tag-suggestion"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => commitTag(tag)}
                      >
                        <span
                          className="material-symbols-rounded"
                          aria-hidden="true"
                        >
                          label
                        </span>
                        <span className="text-label-large">{tag}</span>
                        <span className="tag-suggestion-count text-label-small">
                          {usage} {usage === 1 ? "note" : "notes"}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="tag-suggestion-delete"
                        aria-label={`Delete tag ${tag}`}
                        title={`Delete tag ${tag}`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteTag(tag);
                        }}
                      >
                        <span
                          className="material-symbols-rounded"
                          aria-hidden="true"
                        >
                          delete
                        </span>
                        <div className="state-layer" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {mode === "preview" ? (
          <MarkdownContent
            text={text}
            className="modal-text markdown-body text-body-large custom-scrollbar"
          />
        ) : (
          <textarea
            placeholder="Take a note..."
            value={text}
            className="modal-text text-body-large custom-scrollbar"
            data-note-field
            onChange={(event) => setText(event.target.value)}
          />
        )}

        <div className="modal-footer">
          <span className="time text-label-large">{timeLabel}</span>
          {showWordCount && (
            <span className="counts text-label-large" data-word-count>
              {wordCountLabel}
            </span>
          )}
          <div className="mode-toggle" role="group" aria-label="Editor mode">
            <button
              type="button"
              className={`btn text mode-toggle-btn${mode === "edit" ? " active" : ""}`}
              aria-pressed={mode === "edit"}
              onClick={() => setMode("edit")}
            >
              <span className="text-label-large">Edit</span>
              <div className="state-layer" />
            </button>
            <button
              type="button"
              className={`btn text mode-toggle-btn${mode === "preview" ? " active" : ""}`}
              aria-pressed={mode === "preview"}
              onClick={() => setMode("preview")}
            >
              <span className="text-label-large">Preview</span>
              <div className="state-layer" />
            </button>
          </div>
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
