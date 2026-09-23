import { useMemo, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { addTag, hasTag, removeTag } from "../utils";

const MAX_SUGGESTIONS = 8;

interface NoteTagsProps {
  tags: string[];
  suggestions: string[];
  tagUsage: Record<string, number>;
  onChange: (tags: string[]) => void;
  onCreateTag: (tag: string) => void;
  onDeleteTag: (tag: string) => void;
}

export const NoteTags = ({
  tags,
  suggestions,
  tagUsage,
  onChange,
  onCreateTag,
  onDeleteTag,
}: NoteTagsProps) => {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const matches = useMemo(() => {
    const query = input.trim().toLowerCase();
    return suggestions
      .filter((tag) => {
        if (hasTag(tags, tag)) return false;
        return query ? tag.toLowerCase().includes(query) : true;
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [suggestions, tags, input]);

  const commit = (raw: string) => {
    if (!raw.trim()) return;
    onCreateTag(raw);
    onChange(addTag(tags, raw));
    setInput("");
    setShowSuggestions(false);
    setHighlightedIndex(0);
  };

  const handleDeleteTag = (tag: string) => {
    onDeleteTag(tag);
    onChange(removeTag(tags, tag));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const suggestion =
        showSuggestions && matches[highlightedIndex]
          ? matches[highlightedIndex]
          : input;
      commit(suggestion);
      return;
    }

    if (event.key === ",") {
      event.preventDefault();
      if (input.trim()) commit(input);
      return;
    }

    if (event.key === "Backspace" && input === "" && tags.length > 0) {
      event.preventDefault();
      onChange(tags.slice(0, -1));
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setShowSuggestions(true);
      setHighlightedIndex((index) => Math.min(index + 1, matches.length - 1));
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

  return (
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
              aria-label={t("tags.removeTag", { tag })}
              onClick={() => onChange(removeTag(tags, tag))}
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
          placeholder={tags.length === 0 ? t("tags.addPlaceholder") : undefined}
          aria-label={t("tags.addLabel")}
          value={input}
          role="combobox"
          aria-expanded={showSuggestions && matches.length > 0}
          aria-controls="tag-suggestions"
          aria-autocomplete="list"
          onChange={(event) => {
            setInput(event.target.value);
            setHighlightedIndex(0);
            setShowSuggestions(true);
          }}
          onFocus={() => {
            setHighlightedIndex(0);
            setShowSuggestions(true);
          }}
          onBlur={() => setShowSuggestions(false)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {showSuggestions && matches.length > 0 && (
        <ul
          id="tag-suggestions"
          className="tag-suggestions custom-scrollbar"
          role="listbox"
          aria-label={t("tags.suggestions")}
        >
          {matches.map((tag, index) => {
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
                    onClick={() => commit(tag)}
                  >
                    <span
                      className="material-symbols-rounded"
                      aria-hidden="true"
                    >
                      label
                    </span>
                    <span className="text-label-large">{tag}</span>
                    <span className="tag-suggestion-count text-label-small">
                      {t("tags.noteCount", { count: usage })}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="tag-suggestion-delete"
                    aria-label={t("tags.deleteTag", { tag })}
                    title={t("tags.deleteTag", { tag })}
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
  );
};
