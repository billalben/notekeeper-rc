import { useTranslation } from "react-i18next";
import { IconButton } from "@/shared/ui/IconButton";

interface NoteSelectionBarProps {
  selectedCount: number;
  allSelected: boolean;
  actionLabel: string;
  actionIcon: string;
  onAction: () => void;
  onToggleAll: () => void;
  onClose: () => void;
}

/** Floating toolbar shown while multi-select is active. */
export const NoteSelectionBar = ({
  selectedCount,
  allSelected,
  actionLabel,
  actionIcon,
  onAction,
  onToggleAll,
  onClose,
}: NoteSelectionBarProps) => {
  const { t } = useTranslation();

  return (
    <div
      className="note-selection-bar"
      role="toolbar"
      aria-label={t("selection.label")}
    >
      <span
        className="note-selection-count text-label-large"
        aria-live="polite"
      >
        {t("selection.selected", { count: selectedCount })}
      </span>

      <button type="button" className="btn text" onClick={onToggleAll}>
        <span className="text-label-large">
          {allSelected ? t("selection.clearAll") : t("selection.selectAll")}
        </span>
        <div className="state-layer" />
      </button>

      <button
        type="button"
        className="btn fill"
        disabled={selectedCount === 0}
        onClick={onAction}
      >
        <span className="material-symbols-rounded" aria-hidden="true">
          {actionIcon}
        </span>
        <span className="text-label-large">{actionLabel}</span>
        <div className="state-layer" />
      </button>

      <IconButton
        icon="close"
        tooltip={t("common.close")}
        label={t("common.close")}
        onClick={onClose}
      />
    </div>
  );
};
