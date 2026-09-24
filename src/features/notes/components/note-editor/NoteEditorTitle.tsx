import { useTranslation } from "react-i18next";
import type { ClipboardEvent, KeyboardEvent, RefObject } from "react";
import { NoteTags } from "../NoteTags";

interface NoteEditorTitleProps {
  titleId: string;
  titleRef: RefObject<HTMLInputElement | null>;
  title: string;
  onTitleChange: (title: string) => void;
  onTitleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onTitlePaste: (event: ClipboardEvent<HTMLInputElement>) => void;
  tags: string[];
  tagSuggestions: string[];
  tagUsage: Record<string, number>;
  onTagsChange: (tags: string[]) => void;
  onCreateTag: (tag: string) => void;
  onDeleteTag: (tag: string) => void;
}

/** Title input with title/body paste-splitting, plus the tag editor. */
export const NoteEditorTitle = ({
  titleId,
  titleRef,
  title,
  onTitleChange,
  onTitleKeyDown,
  onTitlePaste,
  tags,
  tagSuggestions,
  tagUsage,
  onTagsChange,
  onCreateTag,
  onDeleteTag,
}: NoteEditorTitleProps) => {
  const { t } = useTranslation();

  return (
    <div className="note-head">
      <input
        id={titleId}
        ref={titleRef}
        type="text"
        className="note-title-input"
        placeholder={t("editor.titlePlaceholder")}
        autoComplete="off"
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        onKeyDown={onTitleKeyDown}
        onPaste={onTitlePaste}
      />
      <NoteTags
        tags={tags}
        suggestions={tagSuggestions}
        tagUsage={tagUsage}
        onChange={onTagsChange}
        onCreateTag={onCreateTag}
        onDeleteTag={onDeleteTag}
      />
    </div>
  );
};
