import { useTranslation } from "react-i18next";
import { formatChord } from "@/shared/lib/shortcuts";

export type FormatKind = "h" | "b" | "i" | "ul" | "task" | "code";
export type EditorMode = "edit" | "preview";

type FormatLabelKey =
  | "editor.toolbar.heading"
  | "editor.toolbar.bold"
  | "editor.toolbar.italic"
  | "editor.toolbar.bulletedList"
  | "editor.toolbar.checklist"
  | "editor.toolbar.code";

type FormatTitleKey = "editor.toolbar.boldTitle" | "editor.toolbar.italicTitle";

interface FormatButton {
  kind: FormatKind;
  labelKey: FormatLabelKey;
  titleKey?: FormatTitleKey;
  chord?: string;
  glyph?: string;
  italic?: boolean;
  icon?: string;
}

const FORMAT_BUTTONS: FormatButton[] = [
  { kind: "h", labelKey: "editor.toolbar.heading", glyph: "H" },
  {
    kind: "b",
    labelKey: "editor.toolbar.bold",
    titleKey: "editor.toolbar.boldTitle",
    chord: "mod+b",
    glyph: "B",
  },
  {
    kind: "i",
    labelKey: "editor.toolbar.italic",
    titleKey: "editor.toolbar.italicTitle",
    chord: "mod+i",
    glyph: "I",
    italic: true,
  },
  {
    kind: "ul",
    labelKey: "editor.toolbar.bulletedList",
    icon: "format_list_bulleted",
  },
  {
    kind: "task",
    labelKey: "editor.toolbar.checklist",
    icon: "checklist",
  },
  { kind: "code", labelKey: "editor.toolbar.code", icon: "code" },
];

interface NoteToolbarProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  onFormat: (kind: FormatKind) => void;
}

export const NoteToolbar = ({
  mode,
  onModeChange,
  onFormat,
}: NoteToolbarProps) => {
  const { t } = useTranslation();
  const isPreview = mode === "preview";

  return (
    <div className="note-toolbar">
      <div
        className={`note-fmt${isPreview ? " is-disabled" : ""}`}
        role="toolbar"
        aria-label={t("editor.toolbar.formatting")}
      >
        {FORMAT_BUTTONS.map((button) => {
          const label = t(button.labelKey);
          const title =
            button.titleKey && button.chord
              ? t(button.titleKey, { chord: formatChord(button.chord) })
              : label;

          return (
            <button
              key={button.kind}
              type="button"
              className="note-icon-btn"
              title={title}
              aria-label={label}
              disabled={isPreview}
              onClick={() => onFormat(button.kind)}
            >
              {button.glyph ? (
                <span
                  className={`note-glyph${button.italic ? " is-italic" : ""}`}
                  aria-hidden="true"
                >
                  {button.glyph}
                </span>
              ) : (
                <span className="material-symbols-rounded" aria-hidden="true">
                  {button.icon}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        className="note-segmented"
        role="tablist"
        aria-label={t("editor.toolbar.mode")}
      >
        <button
          type="button"
          role="tab"
          aria-selected={!isPreview}
          onClick={() => onModeChange("edit")}
        >
          {t("editor.toolbar.edit")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isPreview}
          onClick={() => onModeChange("preview")}
        >
          {t("editor.toolbar.preview")}
        </button>
      </div>
    </div>
  );
};
