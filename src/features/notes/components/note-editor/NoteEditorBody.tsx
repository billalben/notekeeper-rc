import { useTranslation } from "react-i18next";
import type { RefObject } from "react";
import { MarkdownContent } from "@/shared/markdown/MarkdownContent";
import type { EditorMode } from "../NoteToolbar";

interface NoteEditorBodyProps {
  bodyRef: RefObject<HTMLTextAreaElement | null>;
  text: string;
  onTextChange: (text: string) => void;
  mode: EditorMode;
}

/** Raw textarea overlaid by the rendered markdown preview. */
export const NoteEditorBody = ({
  bodyRef,
  text,
  onTextChange,
  mode,
}: NoteEditorBodyProps) => {
  const { t } = useTranslation();

  return (
    <div className="note-editor">
      <textarea
        ref={bodyRef}
        className="note-textarea custom-scrollbar"
        placeholder={t("editor.bodyPlaceholder")}
        spellCheck
        value={text}
        disabled={mode === "preview"}
        style={{ visibility: mode === "edit" ? "visible" : "hidden" }}
        onChange={(event) => onTextChange(event.target.value)}
      />
      {mode === "preview" && (
        <div className="note-preview custom-scrollbar">
          {text.trim() ? (
            <MarkdownContent text={text} className="markdown-body" />
          ) : (
            <p className="note-preview-empty">{t("editor.previewEmpty")}</p>
          )}
        </div>
      )}
    </div>
  );
};
