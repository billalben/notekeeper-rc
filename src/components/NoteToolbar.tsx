export type FormatKind = "h" | "b" | "i" | "ul" | "task" | "code";
export type EditorMode = "edit" | "preview";

interface FormatButton {
  kind: FormatKind;
  label: string;
  title: string;
  glyph?: string;
  italic?: boolean;
  icon?: string;
}

const FORMAT_BUTTONS: FormatButton[] = [
  { kind: "h", label: "Heading", title: "Heading", glyph: "H" },
  { kind: "b", label: "Bold", title: "Bold (Ctrl+B)", glyph: "B" },
  {
    kind: "i",
    label: "Italic",
    title: "Italic (Ctrl+I)",
    glyph: "I",
    italic: true,
  },
  {
    kind: "ul",
    label: "Bulleted list",
    title: "Bulleted list",
    icon: "format_list_bulleted",
  },
  { kind: "task", label: "Checklist", title: "Checklist", icon: "checklist" },
  { kind: "code", label: "Code", title: "Code", icon: "code" },
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
  const isPreview = mode === "preview";

  return (
    <div className="note-toolbar">
      <div
        className={`note-fmt${isPreview ? " is-disabled" : ""}`}
        role="toolbar"
        aria-label="Formatting"
      >
        {FORMAT_BUTTONS.map((button) => (
          <button
            key={button.kind}
            type="button"
            className="note-icon-btn"
            title={button.title}
            aria-label={button.label}
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
        ))}
      </div>

      <div className="note-segmented" role="tablist" aria-label="Mode">
        <button
          type="button"
          role="tab"
          aria-selected={!isPreview}
          onClick={() => onModeChange("edit")}
        >
          Edit
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isPreview}
          onClick={() => onModeChange("preview")}
        >
          Preview
        </button>
      </div>
    </div>
  );
};
